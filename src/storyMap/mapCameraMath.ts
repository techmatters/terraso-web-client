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

import { isValidBounds } from 'terraso-web-client/gis/gisUtils';
import {
  legacyBoundsTarget,
  legacyCenterZoomTarget,
} from 'terraso-web-client/storyMap/legacyMapUtils';
import type { MapPadding } from 'terraso-web-client/storyMap/mapPaddingMath';
import type {
  CameraTarget,
  ChapterAlignment,
  MapBounds,
  MapPosition,
  MapViewport,
  ResolvedCamera,
} from 'terraso-web-client/storyMap/storyMapTypes';

const MAX_SAVED_VIEWPORT_PX = 4096;

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
export const cameraFromViewport = (
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

  const target: CameraTarget = {
    center: [location.center.lng, location.center.lat],
    zoom: location.zoom + Math.log2(scale),
    pitch: location.pitch ?? 0,
    bearing: location.bearing ?? 0,
  };

  return { target, padding };
};

/**
 * One target resolver:
 * - saved viewport -> new camera path, measured padding
 * - old bounds     -> main parity, no padding
 * - old no-bounds  -> main parity, no padding
 */
export const targetForLocation = (
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
