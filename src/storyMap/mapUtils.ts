/*
 * Copyright © 2026 Technology Matters
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see https://www.gnu.org/licenses/.
 */

import _ from 'lodash/fp';
import logger from 'terraso-client-shared/monitoring/logger';

import { angleDistance, isValidBounds } from 'terraso-web-client/gis/gisUtils';
import {
  legacyBoundsTarget,
  legacyCenterZoomTarget,
} from 'terraso-web-client/storyMap/legacyMapUtils';
import {
  NO_PADDING,
  paddingEqual,
  type MapPadding,
} from 'terraso-web-client/storyMap/mapPaddingMath';
import {
  LAYER_PAINT_TYPES,
  LayerPaintType,
  STORY_MAP_TITLE_ID,
} from 'terraso-web-client/storyMap/storyMapConstants';
import {
  CameraTarget,
  ChapterAlignment,
  ChapterConfig,
  LayerConfig,
  MapBounds,
  MapPosition,
  MapViewport,
  ResolvedCamera,
  StoryMapConfig,
  Transition,
} from 'terraso-web-client/storyMap/storyMapTypes';
import { getTransition } from 'terraso-web-client/storyMap/storyMapUtils';

const ROTATION_DURATION = 30000;
const REFERENCE_MAX_VIEWPORT_PX = 1000;
const CENTER_TOLERANCE_FRACTION = 0.2;
const CENTER_EPSILON =
  (CENTER_TOLERANCE_FRACTION * REFERENCE_MAX_VIEWPORT_PX * 360) / 512;
const ZOOM_EPSILON = 0.9;
const ANGLE_EPSILON = 0.01;
const MIN_TRANSITION_DURATION = 500;
const MAX_SAVED_VIEWPORT_PX = 4096;

const getLayerPaintType = (map: mapboxgl.Map, layer: string) => {
  if (!map.getStyle()) {
    return [];
  }

  const layerType = map.getLayer(layer)?.type;
  if (!layerType) {
    logger.warn(`Layer ${layer} not found`);
    return null;
  }
  return LAYER_PAINT_TYPES[layerType as LayerPaintType];
};

const setLayerOpacity = (map: mapboxgl.Map, layer: LayerConfig) => {
  if (!layer.layer) {
    return;
  }
  const paintProps = getLayerPaintType(map, layer.layer);
  paintProps?.forEach(function (prop) {
    if (layer.duration) {
      const transitionProp = `${prop}-transition` as const;
      map.setPaintProperty(layer.layer, transitionProp, {
        duration: layer.duration,
      });
    }
    map.setPaintProperty(layer.layer, prop, layer.opacity);
  });
};

/**
 * The chapter card overlays the map, so the camera fits the chapter's bounds
 * into the strip the card leaves visible. Padding (applied on the map itself)
 * puts the projection center in the middle of that strip, which is why the fit
 * is computed against the safe dimensions instead of expanding the bounds.
 */
const safeDimensions = (
  mapDimensions: { height: number; width: number },
  padding: MapPadding
) => ({
  width: Math.max(1, mapDimensions.width - padding.left - padding.right),
  height: Math.max(1, mapDimensions.height - padding.top - padding.bottom),
});

const isValidViewport = (
  viewport: MapPosition['viewport']
): viewport is MapViewport =>
  Boolean(
    viewport &&
    Number.isFinite(viewport.width) &&
    Number.isFinite(viewport.height) &&
    viewport.width > 0 &&
    viewport.height > 0 &&
    viewport.width <= MAX_SAVED_VIEWPORT_PX &&
    viewport.height <= MAX_SAVED_VIEWPORT_PX
  );

const hasBounds = (
  location: MapPosition
): location is MapPosition & { bounds: MapBounds } =>
  Boolean(location.bounds && isValidBounds(location.bounds));

/**
 * New cameras: preserve the saved center/zoom/pitch/bearing and scale the
 * camera into the target safe area. `min` preserves the full saved framing.
 */
const cameraFromViewport = (
  location: MapPosition,
  mapDimensions: { width: number; height: number },
  padding: MapPadding
): ResolvedCamera | null => {
  if (
    !isValidViewport(location.viewport) ||
    !Number.isFinite(location.zoom) ||
    !location.center
  ) {
    return null;
  }

  const safe = safeDimensions(mapDimensions, padding);
  const scale = Math.min(
    safe.width / location.viewport.width,
    safe.height / location.viewport.height
  );

  return {
    target: {
      center: [location.center.lng, location.center.lat],
      zoom: location.zoom + Math.log2(scale),
      pitch: location.pitch ?? 0,
      bearing: location.bearing ?? 0,
    },
    padding,
  };
};

const sameCenterAndZoom = (
  map: mapboxgl.Map,
  target: CameraTarget
): boolean => {
  const center = map.getCenter();
  const zoom = map.getZoom();
  const centerEpsilon = CENTER_EPSILON / 2 ** zoom;
  const latitudeEpsilon =
    centerEpsilon * Math.cos((center.lat * Math.PI) / 180);

  return (
    angleDistance(center.lng, target.center[0]) <= centerEpsilon &&
    Math.abs(center.lat - target.center[1]) <= latitudeEpsilon &&
    Math.abs(zoom - target.zoom) <= ZOOM_EPSILON
  );
};

const effectiveTransitionDuration = ({
  map,
  target,
  padding,
  duration,
}: {
  map: mapboxgl.Map;
  target: CameraTarget;
  padding: MapPadding;
  duration?: number;
}): number | undefined => {
  // An explicit duration always wins, including 0.
  if (duration !== undefined) {
    return duration;
  }

  // Only Mapbox's center/zoom-based adaptive duration can be too short.
  // If the center/zoom flight is already long, leave it alone.
  if (!sameCenterAndZoom(map, target)) {
    return undefined;
  }

  const paddingChanged = !paddingEqual(map.getPadding(), padding);
  const bearingChanged =
    angleDistance(map.getBearing(), target.bearing) > ANGLE_EPSILON;
  const pitchChanged = Math.abs(map.getPitch() - target.pitch) > ANGLE_EPSILON;

  return paddingChanged || bearingChanged || pitchChanged
    ? MIN_TRANSITION_DURATION
    : undefined;
};

/**
 * One target resolver:
 * - saved viewport -> new camera path, measured padding
 * - old bounds     -> main parity, no padding
 * - old no-bounds  -> main parity, no padding
 */
const targetForLocation = (
  location: MapPosition,
  alignment: ChapterAlignment,
  mapDimensions: { width: number; height: number },
  measuredPadding: MapPadding
): ResolvedCamera | null => {
  const viewportCamera = cameraFromViewport(
    location,
    mapDimensions,
    measuredPadding
  );
  if (viewportCamera) {
    return viewportCamera;
  }

  if (hasBounds(location)) {
    return legacyBoundsTarget(location, alignment, mapDimensions);
  }

  return legacyCenterZoomTarget(location, mapDimensions);
};

const flyToTarget = (
  map: mapboxgl.Map,
  mapAnimation: 'flyTo' | 'easeTo',
  target: CameraTarget,
  padding: MapPadding,
  duration?: number
) => {
  const zoom = Math.max(
    map.getMinZoom(),
    Math.min(map.getMaxZoom(), target.zoom)
  );
  const clampedTarget = { ...target, zoom };

  const effectiveDuration = effectiveTransitionDuration({
    map,
    target: clampedTarget,
    padding,
    duration,
  });

  map[mapAnimation]({
    center: clampedTarget.center,
    zoom: clampedTarget.zoom,
    pitch: clampedTarget.pitch,
    bearing: clampedTarget.bearing,
    padding,
    linear: false,
    essential: true,
    ...(effectiveDuration === undefined ? {} : { duration: effectiveDuration }),
  });
};

const startCameraTransition = (
  map: mapboxgl.Map,
  mapDimensions: { height: number; width: number },
  padding: MapPadding,
  alignment: ChapterAlignment,
  transition: ChapterConfig | Transition
) => {
  if (transition.location && !_.isEmpty(transition.location)) {
    const camera = targetForLocation(
      transition.location,
      alignment,
      mapDimensions,
      padding
    );

    if (camera) {
      flyToTarget(
        map,
        transition.mapAnimation ?? 'flyTo',
        camera.target,
        camera.padding,
        transition.location.duration
      );
    }
  }

  if (transition.rotateAnimation) {
    map.once('moveend', () => {
      const rotateNumber = map.getBearing();
      map.rotateTo(rotateNumber + 180, {
        duration: ROTATION_DURATION,
        easing: t => t,
      });
    });
  }
};

const startLayerTransition = (
  map: mapboxgl.Map,
  chapterId: string,
  config: StoryMapConfig
) => {
  const steps = [
    { id: STORY_MAP_TITLE_ID, ...config.titleTransition },
    ...config.chapters,
  ];

  const currentIndex = steps.findIndex(s => s.id === chapterId);
  if (currentIndex === -1) {
    return;
  }

  const allLayers = new Set<string>();
  // Track whether each layer's first appearance is in an onChapterExit; if so,
  // its default opacity before that exit should be 1 (visible, about to fade out)
  // rather than 0 (not yet shown).
  const firstAppearanceIsExit: Record<string, boolean> = {};
  for (const step of steps) {
    step.onChapterEnter?.forEach(t => {
      if (t.layer) {
        allLayers.add(t.layer);
        if (!(t.layer in firstAppearanceIsExit)) {
          firstAppearanceIsExit[t.layer] = false;
        }
      }
    });
    step.onChapterExit?.forEach(t => {
      if (t.layer) {
        allLayers.add(t.layer);
        if (!(t.layer in firstAppearanceIsExit)) {
          firstAppearanceIsExit[t.layer] = true;
        }
      }
    });
  }

  const mostRecentLayerConfigs: Record<string, LayerConfig> = {};

  for (let i = 0; i <= currentIndex; i++) {
    const step = steps[i];
    step.onChapterEnter?.forEach(t => {
      if (t.layer) {
        mostRecentLayerConfigs[t.layer] = t;
      }
    });
    if (i < currentIndex) {
      step.onChapterExit?.forEach(t => {
        if (t.layer) {
          mostRecentLayerConfigs[t.layer] = t;
        }
      });
    }
  }

  // for layers which haven't yet appeared in the story map, set their opacity to
  // 0 (in case the user scrolls back up), unless the layer's first appearance is
  // in an onChapterExit, in which case default to 1 so the exit can fade it out.
  for (const layer of allLayers) {
    if (!(layer in mostRecentLayerConfigs)) {
      setLayerOpacity(map, {
        layer,
        opacity: firstAppearanceIsExit[layer] ? 1 : 0,
      });
    }
  }

  // for layers which have appeared, run their most recent entry in an onChapterEnter or onChapterExit
  Object.values(mostRecentLayerConfigs).forEach(layerConfig =>
    setLayerOpacity(map, layerConfig)
  );
};

type TransitionLocation = MapPosition & { duration?: number };

const hasLocation = (
  location: TransitionLocation | null | undefined
): location is TransitionLocation => Boolean(location && !_.isEmpty(location));

export const getDefaultTitleLocation = (
  config: StoryMapConfig
): TransitionLocation | undefined => {
  const titleLocation = config.titleTransition?.location;
  if (hasLocation(titleLocation)) {
    return titleLocation;
  }
  return config.chapters.find(chapter => hasLocation(chapter.location))
    ?.location;
};

/**
 * Chapters without a location inherit the nearest previous location. Scrolling
 * down re-applies the camera already in place, so it is a no-op; scrolling up
 * intentionally uses the previous location instead of searching forward.
 */
const resolveTransitionLocation = (
  config: StoryMapConfig,
  chapterId: string
): TransitionLocation | undefined => {
  if (chapterId === STORY_MAP_TITLE_ID) {
    return getDefaultTitleLocation(config);
  }

  const chapterIndex = config.chapters.findIndex(
    chapter => chapter.id === chapterId
  );
  if (chapterIndex === -1) {
    return undefined;
  }

  const ownLocation = config.chapters[chapterIndex].location;
  if (hasLocation(ownLocation)) {
    return ownLocation;
  }

  for (let index = chapterIndex - 1; index >= 0; index--) {
    const location = config.chapters[index].location;
    if (hasLocation(location)) {
      return location;
    }
  }

  return getDefaultTitleLocation(config);
};

export type StartTransitionOptions = {
  config: StoryMapConfig;
  chapterId: string;
  mapDimensions: { height: number; width: number };
  padding?: MapPadding;
  alignment?: ChapterAlignment;
};
export const startTransition = (
  map: mapboxgl.Map,
  {
    config,
    chapterId,
    mapDimensions,
    padding = NO_PADDING,
    alignment = 'center',
  }: StartTransitionOptions
) => {
  const transition = getTransition({
    config,
    id: chapterId,
  });

  if (!map) {
    return;
  }

  const location = resolveTransitionLocation(config, chapterId);
  if (!transition && !location) {
    return;
  }

  const cameraTransition = {
    ...(transition ?? {}),
    ...(location ? { location } : {}),
  } as ChapterConfig | Transition;

  startCameraTransition(
    map,
    mapDimensions,
    padding,
    alignment,
    cameraTransition
  );
  if (transition) {
    startLayerTransition(map, chapterId, config);
  }
};
