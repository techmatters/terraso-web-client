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

import { isValidBounds } from 'terraso-web-client/gis/gisUtils';
import {
  generateLayerId,
  LAYER_TYPE_STACK_ORDER,
  LAYER_TYPES,
} from 'terraso-web-client/sharedData/visualization/components/VisualizationMapLayer';
import {
  LAYER_PAINT_TYPES,
  LayerPaintType,
  STORY_MAP_TITLE_ID,
} from 'terraso-web-client/storyMap/storyMapConstants';
import {
  ChapterAlignment,
  ChapterConfig,
  LayerConfig,
  MapBounds,
  MapLayerTransition,
  MapPosition,
  StoryMapConfig,
  Transition,
} from 'terraso-web-client/storyMap/storyMapTypes';
import { getTransition } from 'terraso-web-client/storyMap/storyMapUtils';

// Assumed viewport size when center/zoom were originally set in the editor
const DEFAULT_ASSUMED_CLIENT_WIDTH = 1200;
const DEFAULT_ASSUMED_CLIENT_HEIGHT = 600;

const ROTATION_DURATION = 30000;

const GENERATED_LAYER_SUFFIXES = Object.values(LAYER_TYPES);

// The `rotateAnimation` handler fires on the NEXT moveend, which may be a
// long way out. Keep a handle so a session that starts meanwhile can drop
// it: its camera-init move would otherwise fire the handler and start a 30s
// rotation whose output gets captured.
const pendingRotateHandlers = new WeakMap<object, () => void>();

export const cancelPendingRotateAnimation = (map?: mapboxgl.Map | null) => {
  if (!map) {
    return;
  }
  const handler = pendingRotateHandlers.get(map);
  if (handler) {
    map.off('moveend', handler);
    pendingRotateHandlers.delete(map);
  }
};

const getLayerPaintType = (map: mapboxgl.Map, layer: string) => {
  if (!map.getStyle()) {
    return [];
  }

  const layerType = map.getLayer(layer)?.type;
  if (!layerType) {
    // Generated data-layer sublayer ids are visibility CANDIDATES (they are
    // not necessarily on the map: the source may still be loading, or the
    // layer was removed) — missing ones are skipped silently instead of
    // spamming a warning per transition per published map.
    if (
      !GENERATED_LAYER_SUFFIXES.some(suffix => layer.endsWith(`-${suffix}`))
    ) {
      logger.warn(`Layer ${layer} not found`);
    }
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
 * Adjust bounds for legacy chapters based on alignment
 * Crops out the area that would be covered by the chapter panel
 */
const adjustBoundsForAlignment = (
  bounds: MapBounds,
  alignment: ChapterAlignment
): MapBounds => {
  if (!alignment || alignment === 'center') {
    return bounds;
  }

  const [swLng, swLat, neLng, neLat] = bounds;
  const lngRange = neLng - swLng;

  if (alignment === 'left') {
    // Crop out lefthand 40% - shift west bound eastward
    return [swLng + lngRange * 0.4, swLat, neLng, neLat];
  } else if (alignment === 'right') {
    // Crop out righthand 40% - shift east bound westward
    return [swLng, swLat, neLng - lngRange * 0.4, neLat];
  }

  return bounds;
};

/**
 * Add padding area to bounds for display based on alignment
 * Expands the bounds to account for the chapter panel
 */
export const expandBoundsForDisplay = (
  bounds: MapBounds,
  alignment: ChapterAlignment
): MapBounds => {
  if (!alignment || alignment === 'center') {
    return bounds;
  }

  const [swLng, swLat, neLng, neLat] = bounds;
  const lngRange = neLng - swLng;
  const expansion = lngRange * (2 / 3); // Add area that's 2/3 the original size

  if (alignment === 'left') {
    // Add area to the left - expand west bound westward
    return [swLng - expansion, swLat, neLng, neLat];
  } else if (alignment === 'right') {
    // Add area to the right - expand east bound eastward
    return [swLng, swLat, neLng + expansion, neLat];
  }

  return bounds;
};

/**
 * Bounds recording (editor side) is the exact inverse of
 * {@link expandBoundsForDisplay} (viewer side): the recorder stores the
 * CONTENT REGION — the strip of the map container the chapter panel leaves
 * uncovered under the viewer's expansion assumption — so the viewer
 * re-expands it to exactly the camera the user framed.
 *
 * The expansion above turns a recorded lng range `r` into `(1 + 2/3) * r`,
 * so the content strip is `1 / (1 + 2/3)` of the container width.
 */
export const CONTENT_REGION_FRACTION = 1 / (1 + 2 / 3);

/**
 * Pixel x-range of the content region (uncovered strip) of a map container
 * with the given width, per chapter alignment. The chapter panel covers the
 * opposite side; 'center' panels overlap the middle and are not compensated
 * (the viewer does not expand centered bounds either).
 */
export const contentRegionPixelRange = (
  width: number,
  alignment: ChapterAlignment
): [number, number] => {
  if (!alignment || alignment === 'center') {
    return [0, width];
  }
  const contentWidth = width * CONTENT_REGION_FRACTION;
  return alignment === 'left'
    ? [width - contentWidth, width]
    : [0, contentWidth];
};

/**
 * The bounds to RECORD for a map position: the content region of the map
 * container at record time (mapbox `unproject` on the strip's corners), not
 * the raw camera bounds. Recording the raw camera makes the viewer display
 * the framing ~`1 + 2/3` times zoomed out for left/right chapters.
 */
export const recordContentRegionBounds = (
  map: mapboxgl.Map,
  alignment: ChapterAlignment
): MapBounds => {
  const rawBounds = map.getBounds().toArray();
  const container = map.getContainer();
  const width = container?.clientWidth;
  const height = container?.clientHeight;
  if (!width || !height) {
    // No layout (e.g. detached container): fall back to the raw camera.
    return [rawBounds[0][0], rawBounds[0][1], rawBounds[1][0], rawBounds[1][1]];
  }
  const [x0, x1] = contentRegionPixelRange(width, alignment);
  const southWest = map.unproject([x0, height]);
  const northEast = map.unproject([x1, 0]);
  return [southWest.lng, southWest.lat, northEast.lng, northEast.lat];
};

/**
 * Backfill bounds for legacy chapters from center/zoom
 * Applies alignment adjustment when calculating
 */
const backfillBounds = (location: MapPosition, alignment: ChapterAlignment) => {
  // Calculate bounds assuming default editor viewport size
  const bounds = calculateLegacyBounds(location.center, location.zoom);

  // Adjust for alignment (crop out covered area)
  return adjustBoundsForAlignment(bounds, alignment);
};

const fitBoundsAnimated = (
  map: mapboxgl.Map,
  mapDimensions: { height: number; width: number },
  mapAnimation: 'flyTo' | 'easeTo',
  { bounds, pitch, bearing, duration }: MapPosition & { duration?: number }
) => {
  const viewport = geoViewport.viewport(
    bounds,
    [mapDimensions.width, mapDimensions.height],
    { allowAntiMeridian: true, allowFloat: true, tileSize: 512 }
  );
  map[mapAnimation]({
    center: viewport.center,
    zoom: viewport.zoom,
    linear: false,
    pitch,
    bearing,
    essential: true,
    ...(duration === undefined ? {} : { duration }),
  });
};

const startCameraTransition = (
  map: mapboxgl.Map,
  isMobile: boolean,
  mapDimensions: { height: number; width: number },
  transition: ChapterConfig | Transition,
  allowRotation: boolean
) => {
  if (transition.location && !_.isEmpty(transition.location)) {
    const alignment =
      isMobile || !('alignment' in transition)
        ? 'center'
        : transition.alignment;

    let boundsToUse = transition.location.bounds;

    // If no bounds, backfill from center/zoom for legacy chapters
    if (!boundsToUse || !isValidBounds(boundsToUse)) {
      const legacyAlignment =
        'alignment' in transition ? transition.alignment : 'center';
      boundsToUse = backfillBounds(transition.location, legacyAlignment);
    }

    const displayBounds = expandBoundsForDisplay(boundsToUse, alignment);

    fitBoundsAnimated(map, mapDimensions, transition.mapAnimation ?? 'flyTo', {
      ...transition.location,
      bounds: displayBounds,
    });
  }

  // Rotation is a PLAYBACK feature: a pending 30s rotateTo would otherwise
  // keep moving the editor map (and record a flipped bearing onto the step
  // being configured). Never rotate outside the viewer.
  if (transition.rotateAnimation && allowRotation) {
    // One pending rotation per map: a new transition replaces the old one.
    cancelPendingRotateAnimation(map);
    const onMoveEnd = () => {
      pendingRotateHandlers.delete(map);
      const rotateNumber = map.getBearing();
      map.rotateTo(rotateNumber + 180, {
        duration: ROTATION_DURATION,
        easing: t => t,
      });
    };
    pendingRotateHandlers.set(map, onMoveEnd);
    map.once('moveend', onMoveEnd);
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
  // Every mounted data layer is a visibility candidate — including layers
  // whose generated events were just removed from every step (immediate-apply
  // layer toggles in the editor): they must fade OUT instead of staying at
  // their last applied opacity. Sublayer ids, matching the event entries.
  Object.keys(config.dataLayers ?? {}).forEach(layerId => {
    Object.values(LAYER_TYPES).forEach(name => {
      allLayers.add(generateLayerId(layerId, name));
    });
  });
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

/**
 * Bottom-to-top stacking order of the mapbox layers generated for a map layer
 * — imported from VisualizationMapLayer (the insertion order of its
 * sublayers) so there is a single source of truth.
 */

/**
 * Rearranges the mapbox layers to match `mapLayers` order (index 0 topmost).
 * Mapbox z-order is global, so this runs on every chapter transition and
 * whenever a layer is added to the map. Sublayers that are not on the map yet
 * are skipped (they will be ordered on the next pass, e.g. after
 * `onLayerAdded`).
 *
 * Always applies the moves (there is no "already ordered" cache): sublayers
 * can be re-added on top of the stack asynchronously — the marker sublayer
 * only renders once its icon image resolves, and a `Layer` effect re-run
 * removes and re-adds its mapbox layer on top — so the applied order can be
 * invalidated without this helper being called. Re-arranging is idempotent
 * and layer existence is checked with `map.getLayer`, never with
 * `map.getStyle()` (which deep-clones the whole style).
 */
export const enforceMapLayerOrder = (
  map: mapboxgl.Map,
  mapLayers: MapLayerTransition[]
) => {
  const exists = (id: string) => Boolean(map.getLayer(id));

  // Desired order, topmost first. Within a map layer, keep the layer's own
  // stacking (markers below polygons outline below polygons fill).
  const desiredTopFirst = mapLayers.flatMap(({ layerId }) =>
    [...LAYER_TYPE_STACK_ORDER]
      .reverse()
      .map(layerType => generateLayerId(layerId, layerType))
      .filter(exists)
  );
  if (desiredTopFirst.length === 0) {
    return;
  }

  // moveLayer() moves a layer to the top of the stack, so apply bottom-first.
  desiredTopFirst
    .slice()
    .reverse()
    .forEach(id => map.moveLayer(id));
};

const startMapLayerOrder = (
  map: mapboxgl.Map,
  transition: ChapterConfig | Transition
) => {
  // Legacy chapters (no mapLayers) keep today's behavior unchanged.
  if (transition.mapLayers === undefined) {
    return;
  }
  enforceMapLayerOrder(map, transition.mapLayers);
};

export type StartTransitionOptions = {
  config: StoryMapConfig;
  chapterId: string;
  mapDimensions: { height: number; width: number };
  isMobile: boolean;
  /**
   * Suspend the camera step-transition (it would fight the user's map drag
   * while the map is being positioned in the editor). Layer fades and
   * z-ordering still run — only the camera move is skipped.
   */
  suspendCamera?: boolean;
  /** Playback-only camera rotation (see `startCameraTransition`). */
  allowRotation?: boolean;
};
export const startTransition = (
  map: mapboxgl.Map,
  {
    config,
    chapterId,
    isMobile,
    mapDimensions,
    suspendCamera,
    allowRotation = true,
  }: StartTransitionOptions
) => {
  const transition = getTransition({
    config,
    id: chapterId,
  });

  if (!map || !transition) {
    return;
  }

  if (!suspendCamera) {
    startCameraTransition(
      map,
      isMobile,
      mapDimensions,
      transition,
      allowRotation
    );
  }
  startLayerTransition(map, chapterId, config);
  startMapLayerOrder(map, transition);
};
