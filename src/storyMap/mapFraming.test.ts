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
  lngToX,
  type WorldShape,
} from 'terraso-web-client/gis/mercator';
import {
  getStoryMapFraming,
  makeStoryMapFraming,
} from 'terraso-web-client/storyMap/mapFraming';
import type { MapBounds } from 'terraso-web-client/storyMap/storyMapTypes';

const EDITOR = { width: 552, height: 400 };
const GLOBAL_BOUNDS: MapBounds = [-180, -85, 180, 85];

const point = (lng: number, lat: number): WorldShape => {
  const x = lngToX(lng);
  const y = latToY(lat);
  return { x0: x, x1: x, y0: y, y1: y };
};

const cluster = (lng: number, lat: number, count: number): WorldShape[] =>
  Array.from({ length: count }, (_, index) =>
    point(lng + (index % 5) * 0.4, lat + Math.floor(index / 5) * 0.4)
  );

test('does not cap bounds that already fit', () => {
  expect(
    getStoryMapFraming({ bounds: [-10, -10, 10, 10], editor: EDITOR })
  ).toBeNull();
});

test('caps global bounds', () => {
  const framing = getStoryMapFraming({
    bounds: GLOBAL_BOUNDS,
    editor: EDITOR,
  });

  expect(framing).not.toBeNull();
  expect(framing?.zoom).toBeCloseTo(3.37, 1);
  expect(framing?.focus).toBeNull();
});

test('focuses the densest cluster when the cap binds', () => {
  const shapes = [...cluster(10, 50, 20), ...cluster(-100, 40, 5)];

  const framing = getStoryMapFraming({
    bounds: GLOBAL_BOUNDS,
    shapes,
    editor: EDITOR,
  });

  expect(framing?.focus).not.toBeNull();
  const [lng, lat] = framing?.focus ?? [0, 0];
  // Europe cluster wins; the exact center can drift toward the centroid
  expect(lng).toBeGreaterThan(-20);
  expect(lng).toBeLessThan(20);
  expect(lat).toBeGreaterThan(40);
  expect(lat).toBeLessThan(60);
});

test('does not frame non-globe projections', () => {
  const framing = makeStoryMapFraming({ projection: 'mercator' });
  expect(framing({ bounds: GLOBAL_BOUNDS, editor: EDITOR })).toBeNull();
});

test('center alignment allows a wider rect than left/right', () => {
  const bounds: MapBounds = [-20, -10, 20, 10];
  const center = makeStoryMapFraming({
    projection: 'globe',
    alignment: 'center',
  });
  const left = makeStoryMapFraming({
    projection: 'globe',
    alignment: 'left',
  });

  expect(center({ bounds, editor: EDITOR })).toBeNull();
  expect(left({ bounds, editor: EDITOR })).not.toBeNull();
});

test('does not frame an empty editor viewport', () => {
  expect(
    getStoryMapFraming({
      bounds: GLOBAL_BOUNDS,
      editor: { width: 0, height: 0 },
    })
  ).toBeNull();
});
