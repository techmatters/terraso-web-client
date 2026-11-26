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

import * as geoViewport from '@placemarkio/geo-viewport';
import _ from 'lodash/fp';
import type { LngLat } from 'mapbox-gl';
import logger from 'terraso-client-shared/monitoring/logger';

import { angleDistance, isValidBounds } from 'terraso-web-client/gis/gisUtils';
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
  ChapterConfig,
  LayerConfig,
  MapBounds,
  MapPosition,
  StoryMapConfig,
  Transition,
} from 'terraso-web-client/storyMap/storyMapTypes';
import { getTransition } from 'terraso-web-client/storyMap/storyMapUtils';

// Assumed viewport size when center/zoom were originally set in the editor
const DEFAULT_ASSUMED_CLIENT_WIDTH = 1200;
const DEFAULT_ASSUMED_CLIENT_HEIGHT = 600;

const ROTATION_DURATION = 30000;
const REFERENCE_MAX_VIEWPORT_PX = 1000;
const CENTER_TOLERANCE_FRACTION = 0.2;
const CENTER_EPSILON =
  (CENTER_TOLERANCE_FRACTION * REFERENCE_MAX_VIEWPORT_PX * 360) / 512;
const ZOOM_EPSILON = 0.9;
const ANGLE_EPSILON = 0.01;
const MIN_TRANSITION_DURATION = 500;

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
 * Calculate bounds from center/zoom for legacy chapters without bounds
 */
const calculateLegacyBounds = (center: LngLat, zoom: number): MapBounds => {
  return geoViewport.bounds(
    [center.lng, center.lat],
    zoom,
    [DEFAULT_ASSUMED_CLIENT_WIDTH, DEFAULT_ASSUMED_CLIENT_HEIGHT],
    512
  );
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

type CameraTarget = {
  center: [number, number];
  zoom: number;
  pitch: number;
  bearing: number;
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

const fitBoundsAnimated = (
  map: mapboxgl.Map,
  mapDimensions: { height: number; width: number },
  padding: MapPadding,
  mapAnimation: 'flyTo' | 'easeTo',
  { bounds, pitch, bearing, duration }: MapPosition & { duration?: number }
) => {
  const safe = safeDimensions(mapDimensions, padding);
  const viewport = geoViewport.viewport(bounds, [safe.width, safe.height], {
    allowAntiMeridian: true,
    allowFloat: true,
    tileSize: 512,
  });

  const target = {
    center: viewport.center,
    zoom: viewport.zoom,
    pitch: pitch ?? map.getPitch(),
    bearing: bearing ?? map.getBearing(),
  };
  const effectiveDuration = effectiveTransitionDuration({
    map,
    target,
    padding,
    duration,
  });

  map[mapAnimation]({
    center: viewport.center,
    zoom: viewport.zoom,
    // Let Mapbox interpolate the vanishing point together with center/zoom.
    padding,
    linear: false,
    pitch,
    bearing,
    essential: true,
    ...(effectiveDuration === undefined ? {} : { duration: effectiveDuration }),
  });
};

const startCameraTransition = (
  map: mapboxgl.Map,
  mapDimensions: { height: number; width: number },
  padding: MapPadding,
  transition: ChapterConfig | Transition
) => {
  if (transition.location && !_.isEmpty(transition.location)) {
    let boundsToUse = transition.location.bounds;

    // If no bounds, backfill from center/zoom for legacy chapters. The legacy
    // bounds are the area the author framed in the editor, so they are fitted
    // as-is: cropping for the chapter card would double-count the padding.
    if (!boundsToUse || !isValidBounds(boundsToUse)) {
      boundsToUse = calculateLegacyBounds(
        transition.location.center,
        transition.location.zoom
      );
    }

    fitBoundsAnimated(
      map,
      mapDimensions,
      padding,
      transition.mapAnimation ?? 'flyTo',
      { ...transition.location, bounds: boundsToUse }
    );
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
 * Chapters without a location inherit one so that alignment changes still
 * reframe the map: nearest previous chapter, then nearest later chapter, then
 * the title transition's location.
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

  for (let index = chapterIndex + 1; index < config.chapters.length; index++) {
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
};
export const startTransition = (
  map: mapboxgl.Map,
  {
    config,
    chapterId,
    mapDimensions,
    padding = NO_PADDING,
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

  startCameraTransition(map, mapDimensions, padding, cameraTransition);
  if (transition) {
    startLayerTransition(map, chapterId, config);
  }
};
