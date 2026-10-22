/*
 * Copyright © 2025 Technology Matters
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

import 'terraso-web-client/config';

import {
  beginProgrammaticMove,
  endProgrammaticMove,
  FIT_MAX_ZOOM,
  fitMapBounds,
  isProgrammaticMove,
  resetProgrammaticMove,
} from 'terraso-web-client/gis/mapCamera';

const makeMap = () => {
  const handlers: Record<string, Array<() => void>> = {};
  return {
    handlers,
    on: jest.fn((event: string, handler: () => void) => {
      (handlers[event] ??= []).push(handler);
    }),
    off: jest.fn((event: string, handler: () => void) => {
      handlers[event] = (handlers[event] ?? []).filter(
        registered => registered !== handler
      );
    }),
    fitBounds: jest.fn(),
    fire: (event: string) => [...(handlers[event] ?? [])].forEach(h => h()),
  };
};

test('fitMapBounds announces the fit around its synchronous camera move', () => {
  const map = makeMap();
  const seenDuringFit: boolean[] = [];
  map.fitBounds.mockImplementation(() => {
    // mapbox applies non-animated fits synchronously: the camera move events
    // fire inside the call.
    seenDuringFit.push(isProgrammaticMove(map));
    map.fire('move');
    map.fire('moveend');
  });

  fitMapBounds(
    map as any,
    [
      [1, 2],
      [1, 2],
    ] as any,
    { animate: false }
  );

  expect(seenDuringFit).toEqual([true]);
  expect(isProgrammaticMove(map)).toBe(false);
  // The zoom is capped by default: single-point fits must not enter mapbox's
  // degenerate maxZoom range (and dataset overviews never want street level).
  expect(map.fitBounds).toHaveBeenCalledWith(
    [
      [1, 2],
      [1, 2],
    ],
    { maxZoom: FIT_MAX_ZOOM, animate: false }
  );
});

test('an animated fit stays announced until its moveend', () => {
  const map = makeMap();

  fitMapBounds(
    map as any,
    [
      [1, 2],
      [3, 4],
    ] as any
  );

  expect(isProgrammaticMove(map)).toBe(true);
  map.fire('moveend');
  expect(isProgrammaticMove(map)).toBe(false);
  // A later moveend must not eat other announcements.
  map.fire('moveend');
  expect(isProgrammaticMove(map)).toBe(false);
});

test('a throwing fit is swallowed and releases its announcement', () => {
  const map = makeMap();
  map.fitBounds.mockImplementation(() => {
    throw new Error('degenerate camera');
  });

  expect(() =>
    fitMapBounds(
      map as any,
      [
        [1, 2],
        [1, 2],
      ] as any,
      { animate: false }
    )
  ).not.toThrow();
  expect(isProgrammaticMove(map)).toBe(false);
});

test('overlapping announcements hold until ALL fits end (decrement, never zero)', () => {
  const map = makeMap();

  beginProgrammaticMove(map);
  beginProgrammaticMove(map);
  expect(isProgrammaticMove(map)).toBe(true);
  endProgrammaticMove(map);
  // The first end must not leak the second fit's user-camera suppression.
  expect(isProgrammaticMove(map)).toBe(true);
  endProgrammaticMove(map);
  expect(isProgrammaticMove(map)).toBe(false);

  // User interaction always wins.
  beginProgrammaticMove(map);
  resetProgrammaticMove(map);
  expect(isProgrammaticMove(map)).toBe(false);
});
