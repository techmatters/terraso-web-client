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
  LAYER_TYPES,
} from 'terraso-web-client/sharedData/visualization/components/VisualizationMapLayer';
import {
  LAYER_PAINT_TYPES,
  LayerPaintType,
} from 'terraso-web-client/storyMap/storyMapConstants';
import {
  ChapterAlignment,
  LayerConfig,
  MapBounds,
  MapPosition,
  StoryMapConfig,
} from 'terraso-web-client/storyMap/storyMapTypes';
import { getTransition } from 'terraso-web-client/storyMap/storyMapUtils';

// Assumed viewport size when center/zoom were originally set in the editor
const DEFAULT_ASSUMED_CLIENT_WIDTH = 1200;
const DEFAULT_ASSUMED_CLIENT_HEIGHT = 600;

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
const expandBoundsForDisplay = (
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
  bounds: MapBounds,
  mapDimensions: { height: number; width: number }
) => {
  const viewport = geoViewport.viewport(
    bounds,
    [mapDimensions.width, mapDimensions.height],
    { allowAntiMeridian: true, allowFloat: true, tileSize: 512 }
  );
  map.flyTo({
    center: viewport.center,
    zoom: viewport.zoom,
    linear: false,
    pitch: 0,
    bearing: 0,
    essential: true,
  });
};

export type StartTransitionOptions = {
  config: StoryMapConfig;
  chapterId: string;
  mapDimensions: { height: number; width: number };
  isMobile: boolean;
};
export const startTransition = (
  map: mapboxgl.Map,
  { config, chapterId, isMobile, mapDimensions }: StartTransitionOptions
) => {
  const transition = getTransition({ config, id: chapterId });

  if (!map || !transition) {
    return;
  }

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

    fitBoundsAnimated(map, displayBounds, mapDimensions);
  }
  transition.onChapterEnter?.forEach(layerConfig =>
    setLayerOpacity(map, layerConfig)
  );

  Object.values(config.dataLayers ?? {})
    .flatMap(({ id: layerId }) =>
      Object.values(LAYER_TYPES).map(layerType =>
        generateLayerId(layerId, layerType)
      )
    )
    .filter(id => transition.onChapterEnter?.every(({ layer }) => layer !== id))
    .forEach(id => {
      setLayerOpacity(map, { layer: id, opacity: 0 });
    });
};
