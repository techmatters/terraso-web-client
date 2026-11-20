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

import {
  startTransition,
  type StartTransitionOptions,
} from 'terraso-web-client/storyMap/mapUtils';
import { NO_PANEL_INSET } from 'terraso-web-client/storyMap/panelInset';
import type {
  ChapterConfig,
  MapBounds,
  MapPosition,
  StoryMapConfig,
} from 'terraso-web-client/storyMap/storyMapTypes';

const WIDTH = 1400;
const HEIGHT = 800;
const PANEL = 490;
// wide enough that the fit stays limited by width in both the full canvas and
// the strip the panel leaves visible
const BOUNDS: MapBounds = [-120, 10, -40, 20];

const viewport = (bounds: MapBounds, dimensions: [number, number]) =>
  geoViewport.viewport(bounds, dimensions, {
    allowAntiMeridian: true,
    allowFloat: true,
    tileSize: 512,
  });

const chapter = (overrides: Partial<ChapterConfig>): ChapterConfig =>
  ({
    id: 'chapter-1',
    alignment: 'center',
    location: {
      center: { lng: -69, lat: 45 },
      zoom: 5,
      pitch: 0,
      bearing: 0,
      bounds: BOUNDS,
    },
    ...overrides,
  }) as ChapterConfig;

const configWith = (overrides: Partial<ChapterConfig>) => {
  const configured = chapter(overrides);
  return {
    style: 'mapbox://styles/mapbox/satellite-v9',
    title: '',
    chapters: [configured],
  } as unknown as StoryMapConfig;
};

const makeMap = () => {
  const calls: string[] = [];
  const recorder = (name: string) =>
    jest.fn((_options?: unknown) => {
      calls.push(name);
    });
  return {
    calls,
    setPadding: recorder('setPadding'),
    flyTo: recorder('flyTo'),
    easeTo: recorder('easeTo'),
    once: jest.fn(),
    getStyle: jest.fn(() => null),
  };
};

const transition = (
  map: ReturnType<typeof makeMap>,
  options: Partial<StartTransitionOptions> = {}
) => {
  startTransition(map as unknown as mapboxgl.Map, {
    config: configWith({}),
    chapterId: 'chapter-1',
    mapDimensions: { width: WIDTH, height: HEIGHT },
    panelInset: NO_PANEL_INSET,
    ...options,
  });
};

const cameraOptions = (
  map: ReturnType<typeof makeMap>,
  name: 'flyTo' | 'easeTo' = 'flyTo'
) => {
  const fn = map[name];
  expect(fn).toHaveBeenCalledTimes(1);
  return fn.mock.calls[0][0] as Record<string, unknown>;
};

test('left panel fits the uncropped bounds into the visible strip', () => {
  const map = makeMap();
  transition(map, { panelInset: { side: 'left', width: PANEL } });

  const expected = viewport(BOUNDS, [WIDTH - PANEL, HEIGHT]);
  const options = cameraOptions(map);

  expect(options.center).toEqual(expected.center);
  expect(options.zoom).toBeCloseTo(expected.zoom, 10);
  expect(options.padding).toEqual({
    top: 0,
    right: 0,
    bottom: 0,
    left: PANEL,
  });
  // Bounds are not expanded anymore: the same zoom-out comes from fitting the
  // original bounds into the narrower strip, which keeps them inside it
  // instead of pushing them under the panel.
  const centered = viewport(BOUNDS, [WIDTH, HEIGHT]);
  expect(options.zoom as number).toBeCloseTo(
    centered.zoom + Math.log2((WIDTH - PANEL) / WIDTH),
    10
  );
  expect(options.zoom as number).toBeLessThan(centered.zoom);
});

test('right panel mirrors the left panel', () => {
  const left = makeMap();
  transition(left, { panelInset: { side: 'left', width: PANEL } });
  const right = makeMap();
  transition(right, { panelInset: { side: 'right', width: PANEL } });

  const leftOptions = cameraOptions(left);
  const rightOptions = cameraOptions(right);
  expect(rightOptions.center).toEqual(leftOptions.center);
  expect(rightOptions.zoom).toBeCloseTo(leftOptions.zoom as number, 10);
});

test('centered chapters fit the full width and clear the padding', () => {
  const map = makeMap();
  transition(map, { panelInset: NO_PANEL_INSET });

  const expected = viewport(BOUNDS, [WIDTH, HEIGHT]);
  const options = cameraOptions(map);

  expect(options.zoom).toBeCloseTo(expected.zoom, 10);
  expect(options.padding).toEqual({ top: 0, right: 0, bottom: 0, left: 0 });
});

test('legacy chapters fit their backfilled bounds without cropping', () => {
  const map = makeMap();
  const location: MapPosition = {
    center: { lng: -69, lat: 45 },
    zoom: 5,
    pitch: 0,
    bearing: 0,
    bounds: undefined,
  } as unknown as MapPosition;
  transition(map, {
    config: configWith({ alignment: 'left', location }),
    panelInset: { side: 'left', width: PANEL },
  });

  const legacyBounds = geoViewport.bounds([-69, 45], 5, [1200, 600], 512);
  const expected = viewport(legacyBounds, [WIDTH - PANEL, HEIGHT]);
  const options = cameraOptions(map);

  expect(options.center).toEqual(expected.center);
  expect(options.zoom).toBeCloseTo(expected.zoom, 10);
});

test('padding is interpolated by the camera move', () => {
  const map = makeMap();
  transition(map, { panelInset: { side: 'left', width: PANEL } });

  expect(map.calls).toEqual(['flyTo']);
  expect(map.setPadding).not.toHaveBeenCalled();
});

test('keeps easeTo for chapters that ask for it', () => {
  const map = makeMap();
  transition(map, {
    config: configWith({ mapAnimation: 'easeTo', alignment: 'right' }),
    panelInset: { side: 'right', width: PANEL },
  });

  expect(map.easeTo).toHaveBeenCalledTimes(1);
  expect(map.flyTo).not.toHaveBeenCalled();
});

test('chapters without a location do not move the camera', () => {
  const map = makeMap();
  transition(map, {
    config: configWith({ location: undefined } as Partial<ChapterConfig>),
    panelInset: { side: 'left', width: PANEL },
  });

  expect(map.flyTo).not.toHaveBeenCalled();
  expect(map.easeTo).not.toHaveBeenCalled();
});
