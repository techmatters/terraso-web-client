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

import { NO_PADDING } from 'terraso-web-client/storyMap/mapPaddingMath';
import type {
  CameraTarget,
  ChapterAlignment,
  MapBounds,
  MapPosition,
  ResolvedCamera,
} from 'terraso-web-client/storyMap/storyMapTypes';

// Assumed editor viewport for legacy no-bounds locations.
const DEFAULT_ASSUMED_CLIENT_WIDTH = 1200;
const DEFAULT_ASSUMED_CLIENT_HEIGHT = 600;

/**
 * The old full-canvas bounds expansion, kept only for legacy locations.
 * `main` assumed the chapter card covered 40% of the width.
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
  const expansion = lngRange * (2 / 3);

  if (alignment === 'left') {
    return [swLng - expansion, swLat, neLng, neLat];
  }
  if (alignment === 'right') {
    return [swLng, swLat, neLng + expansion, neLat];
  }

  return bounds;
};

/**
 * Old bounds chapters: reproduce main exactly.
 * Expand by 2/3 for left/right, fit the expanded bounds to the full canvas,
 * and never pass padding.
 */
export const legacyBoundsTarget = (
  location: MapPosition & { bounds: MapBounds },
  alignment: ChapterAlignment,
  mapDimensions: { width: number; height: number }
): ResolvedCamera => {
  const displayBounds = expandBoundsForDisplay(location.bounds, alignment);
  const viewport = geoViewport.viewport(
    displayBounds,
    [mapDimensions.width, mapDimensions.height],
    { allowAntiMeridian: true, allowFloat: true, tileSize: 512 }
  );

  const target: CameraTarget = {
    center: viewport.center,
    zoom: viewport.zoom,
    pitch: location.pitch ?? 0,
    bearing: location.bearing ?? 0,
  };

  return { target, padding: NO_PADDING };
};

/**
 * Old no-bounds chapters: reproduce main exactly.
 * Backfill bounds from center/zoom at 1200x600, fit to the full canvas,
 * and never pass padding. The old crop+expand pair cancels, so this is also
 * equivalent to the stored center/zoom scaled by the viewer/editor ratio.
 */
export const legacyCenterZoomTarget = (
  location: MapPosition,
  mapDimensions: { width: number; height: number }
): ResolvedCamera | null => {
  if (!Number.isFinite(location.zoom) || !location.center) {
    return null;
  }

  const bounds = geoViewport.bounds(
    [location.center.lng, location.center.lat],
    location.zoom,
    [DEFAULT_ASSUMED_CLIENT_WIDTH, DEFAULT_ASSUMED_CLIENT_HEIGHT],
    512
  );
  const viewport = geoViewport.viewport(
    bounds,
    [mapDimensions.width, mapDimensions.height],
    { allowAntiMeridian: true, allowFloat: true, tileSize: 512 }
  );

  const target: CameraTarget = {
    center: viewport.center,
    zoom: viewport.zoom,
    pitch: location.pitch ?? 0,
    bearing: location.bearing ?? 0,
  };

  return { target, padding: NO_PADDING };
};
