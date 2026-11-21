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
  insetFromRect,
  insetsEqual,
  MAX_PANEL_FRACTION,
  NO_PANEL_INSET,
  paddingForInset,
  panelSideFor,
} from 'terraso-web-client/storyMap/panelInset';

const MAP_RECT = { top: 0, left: 0, right: 1400, bottom: 800, width: 1400 };
const rect = (left: number, width: number) => ({
  top: 300,
  left,
  right: left + width,
  bottom: 600,
  width,
});

test('panelSideFor only reports overlay sides', () => {
  expect(panelSideFor('left', false)).toBe('left');
  expect(panelSideFor('right', false)).toBe('right');
  expect(panelSideFor('center', false)).toBeNull();
  expect(panelSideFor(null, false)).toBeNull();
  expect(panelSideFor(undefined, false)).toBeNull();
  // mobile cards sit below the map instead of over it
  expect(panelSideFor('left', true)).toBeNull();
});

test('measures the covered strip including the story map gutter', () => {
  // .lefty has a 20px gutter, the card itself is 590px wide
  expect(
    insetFromRect({ cardRect: rect(20, 590), mapRect: MAP_RECT, side: 'left' })
  ).toEqual({ side: 'left', width: 610 });
  expect(
    insetFromRect({
      cardRect: rect(MAP_RECT.right - 20 - 590, 590),
      mapRect: MAP_RECT,
      side: 'right',
    })
  ).toEqual({ side: 'right', width: 610 });
});

test('is relative to the map container, not the viewport', () => {
  const nestedMap = { top: 0, left: 200, right: 1000, bottom: 600, width: 800 };
  // a card drawn from the page's left edge covers 820px of the nested map
  expect(
    insetFromRect({ cardRect: rect(0, 820), mapRect: nestedMap, side: 'left' })
  ).toEqual({ side: 'left', width: 800 * MAX_PANEL_FRACTION });
});

test('clamps to a fraction of the map width', () => {
  expect(
    insetFromRect({ cardRect: rect(0, 1399), mapRect: MAP_RECT, side: 'left' })
  ).toEqual({ side: 'left', width: MAP_RECT.width * MAX_PANEL_FRACTION });
});

test('reports no panel for unmeasurable cards', () => {
  expect(
    insetFromRect({ cardRect: rect(20, 0), mapRect: MAP_RECT, side: 'left' })
  ).toBe(NO_PANEL_INSET);
  expect(
    insetFromRect({ cardRect: rect(20, 200), mapRect: MAP_RECT, side: null })
  ).toBe(NO_PANEL_INSET);
});

test('paddingForInset mirrors the panel side and zeroes otherwise', () => {
  expect(paddingForInset({ side: 'left', width: 490 })).toEqual({
    top: 0,
    right: 0,
    bottom: 0,
    left: 490,
  });
  expect(paddingForInset({ side: 'right', width: 490 })).toEqual({
    top: 0,
    right: 490,
    bottom: 0,
    left: 0,
  });
  expect(paddingForInset(NO_PANEL_INSET)).toEqual({
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  });
});

test('insetsEqual tolerates sub-pixel rounding', () => {
  expect(
    insetsEqual({ side: 'left', width: 400 }, { side: 'left', width: 400.4 })
  ).toBe(true);
  expect(
    insetsEqual({ side: 'left', width: 400 }, { side: 'left', width: 401 })
  ).toBe(false);
  expect(insetsEqual({ side: 'left', width: 400 }, NO_PANEL_INSET)).toBe(false);
});
