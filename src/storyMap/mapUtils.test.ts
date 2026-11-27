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
  NO_PADDING,
  type MapPadding,
} from 'terraso-web-client/storyMap/mapPaddingMath';
import {
  getDefaultTitleLocation,
  startTransition,
  type StartTransitionOptions,
} from 'terraso-web-client/storyMap/mapUtils';
import { STORY_MAP_TITLE_ID } from 'terraso-web-client/storyMap/storyMapConstants';
import type {
  ChapterAlignment,
  ChapterConfig,
  MapBounds,
  MapPosition,
  StoryMapConfig,
} from 'terraso-web-client/storyMap/storyMapTypes';

const WIDTH = 1400;
const HEIGHT = 800;
const PADDING_WIDTH = 490;
// wide enough that the fit stays limited by width in both the full canvas and
// the strip the card leaves visible
const BOUNDS: MapBounds = [-120, 10, -40, 20];
const LEFT_PADDING: MapPadding = {
  top: 0,
  right: 0,
  bottom: 0,
  left: PADDING_WIDTH,
};
const RIGHT_PADDING: MapPadding = {
  top: 0,
  right: PADDING_WIDTH,
  bottom: 0,
  left: 0,
};

const viewport = (bounds: MapBounds, dimensions: [number, number]) =>
  geoViewport.viewport(bounds, dimensions, {
    allowAntiMeridian: true,
    allowFloat: true,
    tileSize: 512,
  });

const viewportLocation = (
  bounds: MapBounds,
  dimensions: [number, number] = [WIDTH, HEIGHT]
): MapPosition => {
  const fit = viewport(bounds, dimensions);
  return {
    center: { lng: fit.center[0], lat: fit.center[1] },
    zoom: fit.zoom,
    pitch: 0,
    bearing: 0,
    bounds,
    viewport: { width: dimensions[0], height: dimensions[1] },
  } as MapPosition;
};

const expandForDisplay = (
  bounds: MapBounds,
  alignment: ChapterAlignment
): MapBounds => {
  if (!alignment || alignment === 'center') {
    return bounds;
  }
  const [swLng, swLat, neLng, neLat] = bounds;
  const expansion = (neLng - swLng) * (2 / 3);
  return alignment === 'left'
    ? [swLng - expansion, swLat, neLng, neLat]
    : [swLng, swLat, neLng + expansion, neLat];
};

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

const configWithChapters = (
  chapters: Partial<ChapterConfig>[],
  titleTransition?: StoryMapConfig['titleTransition']
) =>
  ({
    style: 'mapbox://styles/mapbox/satellite-v9',
    title: '',
    chapters: chapters.map((overrides, index) =>
      chapter({ id: `chapter-${index + 1}`, ...overrides })
    ),
    ...(titleTransition ? { titleTransition } : {}),
  }) as unknown as StoryMapConfig;

const location = (bounds: MapBounds): MapPosition =>
  ({
    center: { lng: 0, lat: 0 },
    zoom: 5,
    pitch: 0,
    bearing: 0,
    bounds,
  }) as unknown as MapPosition;

type MapCamera = {
  padding?: MapPadding;
  center?: { lng: number; lat: number };
  zoom?: number;
  pitch?: number;
  bearing?: number;
};

const makeMap = ({
  padding = NO_PADDING,
  center = { lng: 0, lat: 0 },
  zoom = 5,
  pitch = 0,
  bearing = 0,
}: MapCamera = {}) => {
  const calls: string[] = [];
  const recorder = (name: string) =>
    jest.fn((_options?: unknown) => {
      calls.push(name);
    });
  return {
    calls,
    getPadding: jest.fn(() => padding),
    getCenter: jest.fn(() => center),
    getZoom: jest.fn(() => zoom),
    getPitch: jest.fn(() => pitch),
    getBearing: jest.fn(() => bearing),
    getMinZoom: jest.fn(() => 0),
    getMaxZoom: jest.fn(() => 22),
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
    padding: NO_PADDING,
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

test('new viewport cameras fit the saved camera into the visible strip', () => {
  const map = makeMap();
  transition(map, {
    config: configWith({ location: viewportLocation(BOUNDS) }),
    padding: LEFT_PADDING,
    alignment: 'left',
  });

  const expected = viewport(BOUNDS, [WIDTH - PADDING_WIDTH, HEIGHT]);
  const options = cameraOptions(map);

  expect(options.center).toEqual(expected.center);
  expect(options.zoom).toBeCloseTo(expected.zoom, 10);
  expect(options.padding).toEqual({
    top: 0,
    right: 0,
    bottom: 0,
    left: PADDING_WIDTH,
  });
  const centered = viewport(BOUNDS, [WIDTH, HEIGHT]);
  expect(options.zoom as number).toBeCloseTo(
    centered.zoom + Math.log2((WIDTH - PADDING_WIDTH) / WIDTH),
    10
  );
  expect(options.zoom as number).toBeLessThan(centered.zoom);
});

test('right padding mirrors the left padding', () => {
  const left = makeMap();
  transition(left, {
    config: configWith({ location: viewportLocation(BOUNDS) }),
    padding: LEFT_PADDING,
    alignment: 'left',
  });
  const right = makeMap();
  transition(right, {
    config: configWith({ location: viewportLocation(BOUNDS) }),
    padding: RIGHT_PADDING,
    alignment: 'right',
  });

  const leftOptions = cameraOptions(left);
  const rightOptions = cameraOptions(right);
  expect(rightOptions.center).toEqual(leftOptions.center);
  expect(rightOptions.zoom).toBeCloseTo(leftOptions.zoom as number, 10);
  expect(rightOptions.padding).toEqual({
    top: 0,
    right: PADDING_WIDTH,
    bottom: 0,
    left: 0,
  });
});

test('centered chapters fit the full width and clear the padding', () => {
  const map = makeMap();
  transition(map, {
    config: configWith({ location: viewportLocation(BOUNDS) }),
    padding: NO_PADDING,
  });

  const expected = viewport(BOUNDS, [WIDTH, HEIGHT]);
  const options = cameraOptions(map);

  expect(options.zoom).toBeCloseTo(expected.zoom, 10);
  expect(options.padding).toEqual({ top: 0, right: 0, bottom: 0, left: 0 });
});

test('legacy bounds chapters keep main expansion and no padding', () => {
  const map = makeMap();
  transition(map, {
    config: configWith({ alignment: 'left', location: location(BOUNDS) }),
    padding: LEFT_PADDING,
    alignment: 'left',
  });

  const expected = viewport(expandForDisplay(BOUNDS, 'left'), [WIDTH, HEIGHT]);
  const options = cameraOptions(map);

  expect(options.center).toEqual(expected.center);
  expect(options.zoom).toBeCloseTo(expected.zoom, 10);
  expect(options.padding).toEqual(NO_PADDING);
});

test('legacy no-bounds chapters keep main center/zoom behavior', () => {
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
    padding: LEFT_PADDING,
    alignment: 'left',
  });

  const legacyBounds = geoViewport.bounds([-69, 45], 5, [1200, 600], 512);
  const expected = viewport(legacyBounds, [WIDTH, HEIGHT]);
  const options = cameraOptions(map);

  expect(options.center).toEqual(expected.center);
  expect(options.zoom).toBeCloseTo(expected.zoom, 10);
  expect(options.padding).toEqual(NO_PADDING);
});

test('padding is interpolated by the camera move', () => {
  const map = makeMap();
  transition(map, {
    config: configWith({ location: viewportLocation(BOUNDS) }),
    padding: LEFT_PADDING,
  });

  expect(map.calls).toEqual(['flyTo']);
  expect(map.setPadding).not.toHaveBeenCalled();
});

test('keeps easeTo for chapters that ask for it', () => {
  const map = makeMap();
  transition(map, {
    config: configWith({
      mapAnimation: 'easeTo',
      alignment: 'right',
      location: viewportLocation(BOUNDS),
    }),
    padding: RIGHT_PADDING,
    alignment: 'right',
  });

  expect(map.easeTo).toHaveBeenCalledTimes(1);
  expect(map.flyTo).not.toHaveBeenCalled();
});

test('chapters without any inheritable location do not move the camera', () => {
  const map = makeMap();
  transition(map, {
    config: configWith({ location: undefined } as Partial<ChapterConfig>),
    padding: LEFT_PADDING,
  });

  expect(map.flyTo).not.toHaveBeenCalled();
  expect(map.easeTo).not.toHaveBeenCalled();
});

test('inherits the closest previous chapter location', () => {
  const map = makeMap();
  const previousBounds: MapBounds = [-130, -10, -110, 10];
  const laterBounds: MapBounds = [-10, -10, 10, 10];
  const config = configWithChapters([
    { location: location(previousBounds) },
    { location: undefined, alignment: 'right' },
    { location: location(laterBounds) },
  ]);

  startTransition(map as unknown as mapboxgl.Map, {
    config,
    chapterId: 'chapter-2',
    mapDimensions: { width: WIDTH, height: HEIGHT },
    padding: RIGHT_PADDING,
    alignment: 'right',
  });

  const expected = viewport(expandForDisplay(previousBounds, 'right'), [
    WIDTH,
    HEIGHT,
  ]);
  const options = cameraOptions(map);

  expect(options.center).toEqual(expected.center);
  expect(options.zoom).toBeCloseTo(expected.zoom, 10);
  expect(options.padding).toEqual(NO_PADDING);
});

test('falls back to the default title location when there is no previous', () => {
  const map = makeMap();
  const closestLaterBounds: MapBounds = [-10, -10, 10, 10];
  const fartherLaterBounds: MapBounds = [20, 20, 40, 40];
  const config = configWithChapters([
    { location: undefined },
    { location: undefined },
    { location: location(closestLaterBounds) },
    { location: location(fartherLaterBounds) },
  ]);

  startTransition(map as unknown as mapboxgl.Map, {
    config,
    chapterId: 'chapter-2',
    mapDimensions: { width: WIDTH, height: HEIGHT },
    padding: LEFT_PADDING,
  });

  const expected = viewport(closestLaterBounds, [WIDTH, HEIGHT]);
  const options = cameraOptions(map);

  expect(options.center).toEqual(expected.center);
  expect(options.zoom).toBeCloseTo(expected.zoom, 10);
  expect(options.padding).toEqual(NO_PADDING);
});

test('falls back to the title transition location', () => {
  const map = makeMap();
  const titleBounds: MapBounds = [20, 20, 40, 40];
  const config = configWithChapters(
    [{ location: undefined }, { location: undefined }],
    { location: location(titleBounds) }
  );

  startTransition(map as unknown as mapboxgl.Map, {
    config,
    chapterId: 'chapter-2',
    mapDimensions: { width: WIDTH, height: HEIGHT },
    padding: RIGHT_PADDING,
  });

  const expected = viewport(titleBounds, [WIDTH, HEIGHT]);
  const options = cameraOptions(map);

  expect(options.center).toEqual(expected.center);
  expect(options.zoom).toBeCloseTo(expected.zoom, 10);
  expect(options.padding).toEqual(NO_PADDING);
});

test('enforces a 500ms minimum for short alignment transitions', () => {
  const target = viewport(BOUNDS, [WIDTH, HEIGHT]);
  const map = makeMap({
    padding: RIGHT_PADDING,
    center: { lng: target.center[0], lat: target.center[1] },
    zoom: target.zoom,
  });

  transition(map, {
    config: configWith({ location: location(BOUNDS) }),
    padding: LEFT_PADDING,
  });

  expect(cameraOptions(map).duration).toBe(500);
});

test('respects an explicit duration of zero', () => {
  const target = viewport(BOUNDS, [WIDTH, HEIGHT]);
  const map = makeMap({
    padding: RIGHT_PADDING,
    center: { lng: target.center[0], lat: target.center[1] },
    zoom: target.zoom,
  });

  transition(map, {
    config: configWith({
      location: { ...location(BOUNDS), duration: 0 },
    }),
    padding: LEFT_PADDING,
  });

  expect(cameraOptions(map).duration).toBe(0);
});

test('preserves an explicit duration above the minimum', () => {
  const target = viewport(BOUNDS, [WIDTH, HEIGHT]);
  const map = makeMap({
    padding: RIGHT_PADDING,
    center: { lng: target.center[0], lat: target.center[1] },
    zoom: target.zoom,
  });

  transition(map, {
    config: configWith({
      location: { ...location(BOUNDS), duration: 1200 },
    }),
    padding: LEFT_PADDING,
  });

  expect(cameraOptions(map).duration).toBe(1200);
});

test('does not override duration when the camera center changes', () => {
  const map = makeMap({
    padding: RIGHT_PADDING,
    center: { lng: 0, lat: 0 },
    zoom: 5,
  });

  transition(map, {
    config: configWith({ location: location(BOUNDS) }),
    padding: LEFT_PADDING,
  });

  expect(cameraOptions(map).duration).toBeUndefined();
});

test('floors a small zoom change', () => {
  const target = viewport(BOUNDS, [WIDTH, HEIGHT]);
  const map = makeMap({
    padding: RIGHT_PADDING,
    center: { lng: target.center[0], lat: target.center[1] },
    zoom: target.zoom - 0.5,
  });

  transition(map, {
    config: configWith({ location: location(BOUNDS) }),
    padding: LEFT_PADDING,
  });

  expect(cameraOptions(map).duration).toBe(500);
});

test('does not override duration for a large zoom change', () => {
  const target = viewport(BOUNDS, [WIDTH, HEIGHT]);
  const map = makeMap({
    padding: RIGHT_PADDING,
    center: { lng: target.center[0], lat: target.center[1] },
    zoom: target.zoom - 1,
  });

  transition(map, {
    config: configWith({ location: location(BOUNDS) }),
    padding: LEFT_PADDING,
  });

  expect(cameraOptions(map).duration).toBeUndefined();
});

test('floors a pitch change during a short center/zoom flight', () => {
  const target = viewport(BOUNDS, [WIDTH, HEIGHT]);
  const map = makeMap({
    padding: RIGHT_PADDING,
    center: { lng: target.center[0], lat: target.center[1] },
    zoom: target.zoom,
    pitch: 10,
  });

  transition(map, {
    config: configWith({ location: location(BOUNDS) }),
    padding: LEFT_PADDING,
  });

  expect(cameraOptions(map).duration).toBe(500);
});

test('floors a bearing change during a short center/zoom flight', () => {
  const target = viewport(BOUNDS, [WIDTH, HEIGHT]);
  const map = makeMap({
    padding: RIGHT_PADDING,
    center: { lng: target.center[0], lat: target.center[1] },
    zoom: target.zoom,
    bearing: 90,
  });

  transition(map, {
    config: configWith({ location: location(BOUNDS) }),
    padding: LEFT_PADDING,
  });

  expect(cameraOptions(map).duration).toBe(500);
});

test('getDefaultTitleLocation prefers the title transition location', () => {
  const titleBounds: MapBounds = [-10, -10, 10, 10];
  const config = configWithChapters([{ location: location(BOUNDS) }], {
    location: location(titleBounds),
  });

  expect(getDefaultTitleLocation(config)?.bounds).toEqual(titleBounds);
});

test('getDefaultTitleLocation falls back to the first chapter location', () => {
  const config = configWithChapters([
    { location: undefined },
    { location: location(BOUNDS) },
  ]);

  expect(getDefaultTitleLocation(config)?.bounds).toEqual(BOUNDS);
});

test('getDefaultTitleLocation is undefined when there is no location', () => {
  const config = configWithChapters([{ location: undefined }]);
  expect(getDefaultTitleLocation(config)).toBeUndefined();
});

test('restores the default title location when the title has no transition', () => {
  const map = makeMap();
  const config = configWithChapters([{ location: location(BOUNDS) }]);

  startTransition(map as unknown as mapboxgl.Map, {
    config,
    chapterId: STORY_MAP_TITLE_ID,
    mapDimensions: { width: WIDTH, height: HEIGHT },
    padding: NO_PADDING,
  });

  const expected = viewport(BOUNDS, [WIDTH, HEIGHT]);
  const options = cameraOptions(map);

  expect(options.center).toEqual(expected.center);
  expect(options.zoom).toBeCloseTo(expected.zoom, 10);
});
