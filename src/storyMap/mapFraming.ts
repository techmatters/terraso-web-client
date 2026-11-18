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

import {
  latToY,
  xToLng,
  yToLat,
  type WorldShape,
} from 'terraso-web-client/gis/mercator';
import type {
  ChapterAlignment,
  MapBounds,
} from 'terraso-web-client/storyMap/storyMapTypes';

export type FramingRequest = {
  bounds: MapBounds;
  shapes?: WorldShape[] | null;
  editor: { width: number; height: number };
};

export type Framing = { zoom: number; focus: [number, number] | null };

type FramingOptions = {
  minZoom: number;
  referenceWidth: number;
  referenceHeight: number;
  safeAreaFraction: number;
};

export const STORY_MAP_FRAMING: FramingOptions = {
  // Beyond this zoom the globe looks like a flat map. Tune with visual QA.
  minZoom: 3.75,
  // Assume the story map viewer is at least this size
  referenceWidth: 1200,
  referenceHeight: 800,
  // The chapter panel is 35vw, leaving ~60% of the width for the map
  safeAreaFraction: 0.6,
};

const TILE_SIZE = 512;
const GRID_W = 512;
const GRID_H = 256;

export const makeStoryMapFraming =
  ({
    projection,
    alignment,
  }: {
    projection?: string;
    alignment?: ChapterAlignment;
  }) =>
  (request: FramingRequest): Framing | null => {
    if (projection !== 'globe') {
      return null;
    }
    return getStoryMapFraming(request, {
      ...STORY_MAP_FRAMING,
      safeAreaFraction: alignment === 'center' ? 1 : 0.6,
    });
  };

export const getStoryMapFraming = (
  { bounds, shapes, editor }: FramingRequest,
  options: FramingOptions = STORY_MAP_FRAMING
): Framing | null => {
  if (editor.width <= 0 || editor.height <= 0) {
    return null;
  }

  const max = maxRect(options);
  const size = boundsSize(bounds);
  if (size.width <= max.width && size.height <= max.height) {
    // Fits already: keep the current fitBounds behavior untouched
    return null;
  }

  // Largest allowed stored rect, expressed through the editor viewport
  const zoom = Math.max(
    Math.log2(editor.width / (TILE_SIZE * max.width)),
    Math.log2(editor.height / (TILE_SIZE * max.height))
  );
  const window = {
    width: editor.width / (TILE_SIZE * 2 ** zoom),
    height: editor.height / (TILE_SIZE * 2 ** zoom),
  };

  return {
    zoom,
    focus: shapes?.length ? chooseFocus(shapes, window) : null,
  };
};

const maxRect = ({
  minZoom,
  referenceWidth,
  referenceHeight,
  safeAreaFraction,
}: FramingOptions) => ({
  width: (safeAreaFraction * referenceWidth) / (TILE_SIZE * 2 ** minZoom),
  height: referenceHeight / (TILE_SIZE * 2 ** minZoom),
});

const boundsSize = ([swLng, swLat, neLng, neLat]: MapBounds) => {
  let deltaLng = neLng - swLng;
  if (deltaLng < 0) {
    deltaLng += 360;
  }
  return {
    width: deltaLng / 360,
    height: Math.abs(latToY(swLat) - latToY(neLat)),
  };
};

const clamp = (value: number, lo: number, hi: number) =>
  Math.min(hi, Math.max(lo, value));

/**
 * Pick the window center that sees the most geometries: every shape votes for
 * all centers whose window intersects (or fully contains) its bbox. A 2D
 * difference array makes this O(shapes + grid).
 */
const chooseFocus = (
  shapes: WorldShape[],
  window: { width: number; height: number }
): [number, number] => {
  const { scores: intersects, stride } = centerScoreGrid(shapes, window, false);
  const { scores: contains } = centerScoreGrid(shapes, window, true);
  const centroid = circularCentroid(shapes);

  let best = {
    gx: 0,
    gy: 0,
    intersects: -1,
    contains: -1,
    distance: Infinity,
  };

  for (let gy = 0; gy < GRID_H; gy++) {
    for (let gx = 0; gx < GRID_W; gx++) {
      const i = gy * stride + gx;
      const distance = centerDistance(gx, gy, centroid);
      const better =
        intersects[i] > best.intersects ||
        (intersects[i] === best.intersects &&
          (contains[i] > best.contains ||
            (contains[i] === best.contains && distance < best.distance)));
      if (better) {
        best = {
          gx,
          gy,
          intersects: intersects[i],
          contains: contains[i],
          distance,
        };
      }
    }
  }

  return [xToLng((best.gx + 0.5) / GRID_W), yToLat((best.gy + 0.5) / GRID_H)];
};

const centerScoreGrid = (
  shapes: WorldShape[],
  window: { width: number; height: number },
  fullyContained: boolean
) => {
  const stride = GRID_W + 1;
  const scores = new Int32Array(stride * (GRID_H + 1));

  for (const shape of shapes) {
    const xIntervals = fullyContained
      ? containedXIntervals(shape, window)
      : intersectXIntervals(shape, window);
    if (!xIntervals.length) {
      continue;
    }

    const yA = fullyContained
      ? shape.y1 - window.height / 2
      : shape.y0 - window.height / 2;
    const yB = fullyContained
      ? shape.y0 + window.height / 2
      : shape.y1 + window.height / 2;
    if (yA > yB) {
      continue;
    }

    const gy0 = clamp(
      Math.ceil(Math.max(0, Math.min(1, yA)) * GRID_H - 0.5),
      0,
      GRID_H - 1
    );
    const gy1 = clamp(
      Math.floor(Math.max(0, Math.min(1, yB)) * GRID_H - 0.5),
      0,
      GRID_H - 1
    );
    if (gy0 > gy1) {
      continue;
    }

    for (const [x0, x1] of xIntervals) {
      const gx0 = clamp(Math.ceil(x0 * GRID_W - 0.5), 0, GRID_W - 1);
      const gx1 = clamp(Math.floor(x1 * GRID_W - 0.5), 0, GRID_W - 1);
      if (gx0 > gx1) {
        continue;
      }

      scores[gy0 * stride + gx0] += 1;
      scores[gy0 * stride + gx1 + 1] -= 1;
      scores[(gy1 + 1) * stride + gx0] -= 1;
      scores[(gy1 + 1) * stride + gx1 + 1] += 1;
    }
  }

  for (let y = 0; y < GRID_H; y++) {
    for (let x = 1; x < GRID_W; x++) {
      scores[y * stride + x] += scores[y * stride + x - 1];
    }
  }
  for (let x = 0; x < GRID_W; x++) {
    for (let y = 1; y < GRID_H; y++) {
      scores[y * stride + x] += scores[(y - 1) * stride + x];
    }
  }

  return { scores, stride };
};

const intersectXIntervals = (shape: WorldShape, window: { width: number }) =>
  splitCircle(shape.x0 - window.width / 2, shape.x1 + window.width / 2);

const containedXIntervals = (shape: WorldShape, window: { width: number }) =>
  shape.x1 - shape.x0 <= window.width
    ? splitCircle(shape.x1 - window.width / 2, shape.x0 + window.width / 2)
    : [];

const splitCircle = (a: number, b: number): [number, number][] => {
  const width = b - a;
  if (width >= 1) {
    return [[0, 1]];
  }
  if (width <= 0) {
    return [];
  }
  const start = ((a % 1) + 1) % 1;
  const end = start + width;
  return end <= 1
    ? [[start, end]]
    : [
        [start, 1],
        [0, end - 1],
      ];
};

const circularCentroid = (shapes: WorldShape[]) => {
  let sinX = 0;
  let cosX = 0;
  let sumY = 0;
  for (const shape of shapes) {
    const angle = 2 * Math.PI * ((shape.x0 + shape.x1) / 2);
    sinX += Math.sin(angle);
    cosX += Math.cos(angle);
    sumY += (shape.y0 + shape.y1) / 2;
  }
  return {
    x: (Math.atan2(sinX, cosX) / (2 * Math.PI) + 1) % 1,
    y: sumY / shapes.length,
  };
};

const centerDistance = (
  gx: number,
  gy: number,
  centroid: { x: number; y: number }
) => {
  const x = (gx + 0.5) / GRID_W;
  const y = (gy + 0.5) / GRID_H;
  const dx = Math.min(Math.abs(x - centroid.x), 1 - Math.abs(x - centroid.x));
  const dy = y - centroid.y;
  return dx * dx + dy * dy;
};
