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
  MAX_PADDING_FRACTION,
  NO_PADDING,
  paddingEqual,
  paddingFromRect,
  paddingSideFor,
} from 'terraso-web-client/storyMap/mapPaddingMath';

const MAP_RECT = { top: 0, left: 0, right: 1400, bottom: 800, width: 1400 };
const rect = (left: number, width: number) => ({
  top: 300,
  left,
  right: left + width,
  bottom: 600,
  width,
});

test('paddingSideFor only reports overlay sides', () => {
  expect(paddingSideFor('left', false)).toBe('left');
  expect(paddingSideFor('right', false)).toBe('right');
  expect(paddingSideFor('center', false)).toBeNull();
  expect(paddingSideFor(null, false)).toBeNull();
  expect(paddingSideFor(undefined, false)).toBeNull();
  // mobile cards sit below the map instead of over it
  expect(paddingSideFor('left', true)).toBeNull();
});

test('measures the covered strip including the story map gutter', () => {
  // .lefty has a 20px gutter, the card itself is 590px wide
  expect(
    paddingFromRect({
      cardRect: rect(20, 590),
      mapRect: MAP_RECT,
      side: 'left',
    })
  ).toEqual({ top: 0, right: 0, bottom: 0, left: 610 });
  expect(
    paddingFromRect({
      cardRect: rect(MAP_RECT.right - 20 - 590, 590),
      mapRect: MAP_RECT,
      side: 'right',
    })
  ).toEqual({ top: 0, right: 610, bottom: 0, left: 0 });
});

test('is relative to the map container, not the viewport', () => {
  const nestedMap = { top: 0, left: 200, right: 1000, bottom: 600, width: 800 };
  // a card drawn from the page's left edge covers 820px of the nested map
  expect(
    paddingFromRect({
      cardRect: rect(0, 820),
      mapRect: nestedMap,
      side: 'left',
    })
  ).toEqual({
    top: 0,
    right: 0,
    bottom: 0,
    left: 800 * MAX_PADDING_FRACTION,
  });
});

test('clamps to a fraction of the map width', () => {
  expect(
    paddingFromRect({
      cardRect: rect(0, 1399),
      mapRect: MAP_RECT,
      side: 'left',
    })
  ).toEqual({
    top: 0,
    right: 0,
    bottom: 0,
    left: MAP_RECT.width * MAX_PADDING_FRACTION,
  });
});

test('reports no padding for unmeasurable cards', () => {
  expect(
    paddingFromRect({
      cardRect: rect(20, 0),
      mapRect: MAP_RECT,
      side: 'left',
    })
  ).toBe(NO_PADDING);
  expect(
    paddingFromRect({
      cardRect: rect(20, 200),
      mapRect: MAP_RECT,
      side: null,
    })
  ).toBe(NO_PADDING);
});

test('paddingEqual treats missing sides as zero', () => {
  expect(paddingEqual({ left: 400 }, { left: 400 })).toBe(true);
  expect(paddingEqual({ left: 400 }, { left: 401 })).toBe(false);
  expect(paddingEqual({}, NO_PADDING)).toBe(true);
  expect(paddingEqual(undefined, NO_PADDING)).toBe(true);
  expect(paddingEqual({ right: 400 }, { left: 400 })).toBe(false);
});
