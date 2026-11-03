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

import {
  CONTENT_REGION_FRACTION,
  contentRegionPixelRange,
  enforceMapLayerOrder,
  expandBoundsForDisplay,
  recordContentRegionBounds,
  startTransition,
} from 'terraso-web-client/storyMap/mapUtils';
import { STORY_MAP_TITLE_ID } from 'terraso-web-client/storyMap/storyMapConstants';
import {
  ChapterAlignment,
  StoryMapConfig,
  Transition,
} from 'terraso-web-client/storyMap/storyMapTypes';

const createFakeMap = (layerIds: string[] = []) => {
  // Real mapbox moveLayer(id, beforeId?) semantics over an ordered id array
  // (index 0 = bottom of the stack); tests assert the resulting ORDER.
  const layers = [...layerIds];
  // Like real mapbox, map.getLayer(id) hands out ONE stable style-layer
  // object per id — until the layer is re-added or the style is swapped.
  const layerObjects = new Map<string, { type: string }>();
  const layerObjectFor = (id: string) => {
    if (!layerObjects.has(id)) {
      const type = id.endsWith('-markers')
        ? 'circle'
        : id.endsWith('-polygons-outline')
          ? 'line'
          : 'fill';
      layerObjects.set(id, { type });
    }
    return layerObjects.get(id);
  };
  // Real event-listener semantics (like the shared mapboxMock): the rotate
  // hand-off registers a pending `moveend` handler via `once`, and the
  // justChapter skip path must DROP it — a bare jest.fn `once` cannot express
  // "handler dropped", and a tautological `not.toHaveBeenCalled` is worse.
  type Handler = ((...args: unknown[]) => void) & { __original?: unknown };
  const events: Record<string, Handler[]> = {};
  const map = {
    layerOrder: () => [...layers],
    moveLayer: jest.fn((id: string, beforeId?: string) => {
      const fromIndex = layers.indexOf(id);
      if (fromIndex === -1) {
        return;
      }
      layers.splice(fromIndex, 1);
      const toIndex =
        beforeId === undefined ? layers.length : layers.indexOf(beforeId);
      layers.splice(toIndex === -1 ? layers.length : toIndex, 0, id);
    }),
    getStyle: () => ({ layers: layers.map(id => ({ id })) }),
    getLayer: (id: string) =>
      layers.includes(id) ? layerObjectFor(id) : undefined,
    // Simulates setStyle() (all objects replaced) or Layer re-adding its
    // layer (one object replaced): the next getLayer() hands out fresh
    // objects.
    invalidateLayerObjects: (id?: string) => {
      if (id === undefined) {
        layerObjects.clear();
      } else {
        layerObjects.delete(id);
      }
    },
    setPaintProperty: jest.fn(),
    flyTo: jest.fn(),
    easeTo: jest.fn(),
    stop: jest.fn(),
    on: jest.fn((type: string, cb: Handler) => {
      (events[type] ??= []).push(cb);
    }),
    once: jest.fn((type: string, cb: Handler) => {
      const wrapped: Handler = (...args: unknown[]) => {
        map.off(type, wrapped);
        cb(...args);
      };
      wrapped.__original = cb;
      (events[type] ??= []).push(wrapped);
    }),
    off: jest.fn((type: string, cb: Handler) => {
      const handlers = events[type];
      if (!handlers) {
        return;
      }
      if (!cb) {
        delete events[type];
        return;
      }
      events[type] = handlers.filter(
        handler => handler !== cb && handler.__original !== cb
      );
    }),
    fire: (type: string, ...args: unknown[]) => {
      [...(events[type] ?? [])].forEach(handler => handler(...args));
    },
    getBearing: () => 0,
    rotateTo: jest.fn(),
    getBounds: () => ({
      toArray: () => [
        [0, 0],
        [1, 1],
      ],
    }),
    getCenter: () => ({ lng: 0, lat: 0 }),
    getZoom: () => 1,
    getPitch: () => 0,
  };
  return map;
};

const layerSublayerIds = (layerId: string) => [
  `${layerId}-markers`,
  `${layerId}-polygons-outline`,
  `${layerId}-polygons-fill`,
];

const makeConfig = (transitions: {
  titleTransition?: Transition;
  chapters: Partial<StoryMapConfig['chapters'][number]>[];
}): StoryMapConfig =>
  ({
    style: 'mapbox://styles/mapbox/streets-v12',
    themeId: 'theme-1',
    showMarkers: false,
    use3dTerrain: false,
    title: 'Test',
    subtitle: '',
    byline: '',
    titleTransition: transitions.titleTransition,
    chapters: transitions.chapters.map((chapter, index) => ({
      id: `chapter-${index + 1}`,
      title: `Chapter ${index + 1}`,
      description: [],
      alignment: 'center',
      media: undefined,
      ...chapter,
    })),
  }) as unknown as StoryMapConfig;

const runTransition = (
  map: ReturnType<typeof createFakeMap>,
  config: StoryMapConfig,
  chapterId: string,
  options: {
    suspendCamera?: boolean;
    allowLayerForcing?: boolean;
    isMobile?: boolean;
  } = {}
) =>
  startTransition(map as never, {
    config,
    chapterId,
    mapDimensions: { width: 1200, height: 600 },
    isMobile: false,
    ...options,
  });

describe('enforceMapLayerOrder', () => {
  test('moves layer sublayers so mapLayers[0] is topmost', () => {
    const map = createFakeMap([
      ...layerSublayerIds('a'),
      ...layerSublayerIds('b'),
    ]);

    enforceMapLayerOrder(map as never, [{ layerId: 'b' }, { layerId: 'a' }]);

    // mapLayers[0] (b) topmost, a fully below it; within a map layer the
    // sublayers keep markers < outline < fill (bottom-to-top).
    expect(map.layerOrder()).toEqual([
      'a-markers',
      'a-polygons-outline',
      'a-polygons-fill',
      'b-markers',
      'b-polygons-outline',
      'b-polygons-fill',
    ]);
  });

  test('skips sublayers that are not on the map yet', () => {
    const map = createFakeMap(['b-polygons-fill', 'a-markers']);

    enforceMapLayerOrder(map as never, [{ layerId: 'b' }, { layerId: 'a' }]);

    // b topmost with only its fill sublayer present; missing sublayers are
    // skipped without disturbing the pass.
    expect(map.layerOrder()).toEqual(['a-markers', 'b-polygons-fill']);
  });

  test('re-asserts the order after an external layer re-add (async arrival)', () => {
    const map = createFakeMap([
      ...layerSublayerIds('a'),
      ...layerSublayerIds('b'),
    ]);
    const mapLayers = [{ layerId: 'b' }, { layerId: 'a' }];

    enforceMapLayerOrder(map as never, mapLayers);
    // Sublayers arriving asynchronously (e.g. marker icons resolving) are
    // added on top of the stack, displacing the enforced order.
    map.moveLayer('a-markers');

    enforceMapLayerOrder(map as never, mapLayers);

    expect(map.layerOrder()).toEqual([
      'a-markers',
      'a-polygons-outline',
      'a-polygons-fill',
      'b-markers',
      'b-polygons-outline',
      'b-polygons-fill',
    ]);
  });

  test('re-applies the order after a style switch replaces the layers', () => {
    const map = createFakeMap([...layerSublayerIds('a')]);
    const mapLayers = [{ layerId: 'a' }];

    enforceMapLayerOrder(map as never, mapLayers);
    map.moveLayer.mockClear();

    // setStyle() replaces every style layer object: the new style has its
    // own order, so the applied-order cache must not claim the old one.
    map.invalidateLayerObjects();
    enforceMapLayerOrder(map as never, mapLayers);

    expect(map.moveLayer).toHaveBeenCalledTimes(layerSublayerIds('a').length);
  });

  test('re-applies the order after one layer is re-added (its object is replaced)', () => {
    const map = createFakeMap([...layerSublayerIds('a')]);
    const mapLayers = [{ layerId: 'a' }];

    enforceMapLayerOrder(map as never, mapLayers);
    map.moveLayer.mockClear();

    // Layer.js removes and re-adds its layer when its props change: the
    // re-added layer lands on TOP of the stack and must be re-ordered.
    map.invalidateLayerObjects('a-markers');
    enforceMapLayerOrder(map as never, mapLayers);

    expect(map.moveLayer).toHaveBeenCalledTimes(layerSublayerIds('a').length);
  });
});

describe('startTransition layer ordering', () => {
  test('does not reorder map layers for legacy chapters (no mapLayers)', () => {
    const config = makeConfig({
      chapters: [
        {
          dataLayerConfigId: 'a',
          onChapterEnter: [{ layer: 'a-markers', opacity: 1, duration: 0 }],
          onChapterExit: [{ layer: 'a-markers', opacity: 0, duration: 0 }],
        },
      ],
    });
    const map = createFakeMap(layerSublayerIds('a'));

    runTransition(map, config, 'chapter-1');

    expect(map.moveLayer).not.toHaveBeenCalled();
    expect(map.layerOrder()).toEqual(layerSublayerIds('a'));
    // legacy opacity driving keeps working unchanged
    expect(map.setPaintProperty).toHaveBeenCalledWith(
      'a-markers',
      'circle-opacity',
      1
    );
  });

  test('reorders map layers on multi-layer chapter transitions', () => {
    const config = makeConfig({
      chapters: [
        {
          mapLayers: [{ layerId: 'b' }, { layerId: 'a' }],
          dataLayerConfigId: 'b',
          onChapterEnter: [
            { layer: 'a-markers', opacity: 1, duration: 0 },
            { layer: 'b-markers', opacity: 1, duration: 0 },
          ],
          onChapterExit: [
            { layer: 'a-markers', opacity: 0, duration: 0 },
            { layer: 'b-markers', opacity: 0, duration: 0 },
          ],
        },
      ],
    });
    const map = createFakeMap([
      ...layerSublayerIds('a'),
      ...layerSublayerIds('b'),
    ]);

    runTransition(map, config, 'chapter-1');

    expect(map.layerOrder()).toEqual([
      'a-markers',
      'a-polygons-outline',
      'a-polygons-fill',
      'b-markers',
      'b-polygons-outline',
      'b-polygons-fill',
    ]);
  });

  test('reorders map layers for a multi-layer titleTransition', () => {
    const config = makeConfig({
      titleTransition: {
        location: undefined,
        mapLayers: [{ layerId: 'a' }, { layerId: 'b' }],
      } as unknown as Transition,
      chapters: [],
    });
    const map = createFakeMap([
      ...layerSublayerIds('a'),
      ...layerSublayerIds('b'),
    ]);

    runTransition(map, config, STORY_MAP_TITLE_ID);

    expect(map.layerOrder()).toEqual([
      'b-markers',
      'b-polygons-outline',
      'b-polygons-fill',
      'a-markers',
      'a-polygons-outline',
      'a-polygons-fill',
    ]);
  });

  test('opacity driving keeps working for multi-layer chapters', () => {
    const config = makeConfig({
      chapters: [
        {
          mapLayers: [{ layerId: 'b' }, { layerId: 'a' }],
          dataLayerConfigId: 'b',
          onChapterEnter: [
            { layer: 'a-markers', opacity: 1, duration: 0 },
            { layer: 'a-polygons-fill', opacity: 0.5, duration: 0 },
            { layer: 'b-markers', opacity: 1, duration: 0 },
            { layer: 'b-polygons-fill', opacity: 0.25, duration: 0 },
          ],
          onChapterExit: [
            { layer: 'a-markers', opacity: 0, duration: 0 },
            { layer: 'a-polygons-fill', opacity: 0, duration: 0 },
            { layer: 'b-markers', opacity: 0, duration: 0 },
            { layer: 'b-polygons-fill', opacity: 0, duration: 0 },
          ],
        },
      ],
    });
    const map = createFakeMap([
      ...layerSublayerIds('a'),
      ...layerSublayerIds('b'),
    ]);

    runTransition(map, config, 'chapter-1');

    expect(map.setPaintProperty).toHaveBeenCalledWith(
      'a-polygons-fill',
      'fill-opacity',
      0.5
    );
    expect(map.setPaintProperty).toHaveBeenCalledWith(
      'b-polygons-fill',
      'fill-opacity',
      0.25
    );
    expect(map.setPaintProperty).toHaveBeenCalledWith(
      'b-markers',
      'circle-opacity',
      1
    );
  });
});

describe('startTransition camera suspension', () => {
  const cameraConfig = () =>
    makeConfig({
      chapters: [
        {
          location: {
            center: { lng: -79.9, lat: -2.4 },
            zoom: 5,
            pitch: 0,
            bearing: 0,
            bounds: [-80, -3, -79, -2],
          } as unknown as Transition['location'],
          mapLayers: [{ layerId: 'a' }],
          dataLayerConfigId: 'a',
          onChapterEnter: [{ layer: 'a-markers', opacity: 1, duration: 0 }],
          onChapterExit: [{ layer: 'a-markers', opacity: 0, duration: 0 }],
        },
      ],
    });

  test('suspendCamera skips the camera move but keeps layer fades and ordering', () => {
    const map = createFakeMap(layerSublayerIds('a'));

    runTransition(map, cameraConfig(), 'chapter-1', { suspendCamera: true });

    expect(map.flyTo).not.toHaveBeenCalled();
    expect(map.easeTo).not.toHaveBeenCalled();
    // Layer fades still run…
    expect(map.setPaintProperty).toHaveBeenCalledWith(
      'a-markers',
      'circle-opacity',
      1
    );
    // …and z-order is still enforced.
    expect(map.layerOrder()).toEqual(layerSublayerIds('a'));
  });

  test('resuming the camera runs the step transition', () => {
    const map = createFakeMap(layerSublayerIds('a'));

    runTransition(map, cameraConfig(), 'chapter-1');

    expect(map.flyTo).toHaveBeenCalled();
  });
});

describe('content region bounds recording (bounds WYSIWYG)', () => {
  const FRAME = { clientWidth: 1200, clientHeight: 600 };
  const CAMERA_BOUNDS = [-180, -90, 180, 90];

  // A map whose pixel → lng/lat mapping is LINEAR over the camera bounds
  // (exactly what the round-trip needs to check).
  const createLinearMap = (container = FRAME) => {
    const [w, s, e, n] = CAMERA_BOUNDS;
    return {
      getBounds: () => ({
        toArray: () => [
          [w, s],
          [e, n],
        ],
      }),
      getContainer: () => container,
      unproject: ([x, y]: [number, number]) => ({
        lng: w + (x / FRAME.clientWidth) * (e - w),
        lat: n - (y / FRAME.clientHeight) * (n - s),
      }),
    } as unknown as Parameters<typeof recordContentRegionBounds>[0];
  };

  test('content region pixel range covers the uncovered strip per alignment', () => {
    const contentWidth = FRAME.clientWidth * CONTENT_REGION_FRACTION;
    expect(contentRegionPixelRange(FRAME.clientWidth, 'left')).toEqual([
      FRAME.clientWidth - contentWidth,
      FRAME.clientWidth,
    ]);
    expect(contentRegionPixelRange(FRAME.clientWidth, 'right')).toEqual([
      0,
      contentWidth,
    ]);
    expect(contentRegionPixelRange(FRAME.clientWidth, 'center')).toEqual([
      0,
      FRAME.clientWidth,
    ]);
    expect(contentRegionPixelRange(FRAME.clientWidth, undefined)).toEqual([
      0,
      FRAME.clientWidth,
    ]);
  });

  test('content region is the full map for the just-modes (no uncovered strip contract)', () => {
    // justMap renders no card at all; justChapter covers the whole map —
    // neither leaves an uncovered strip to record, so the content region is
    // the full container width.
    expect(contentRegionPixelRange(FRAME.clientWidth, 'justMap')).toEqual([
      0,
      FRAME.clientWidth,
    ]);
    expect(contentRegionPixelRange(FRAME.clientWidth, 'justChapter')).toEqual([
      0,
      FRAME.clientWidth,
    ]);
  });

  test.each(['left', 'right', 'center', 'justMap', 'justChapter'] as const)(
    'recorded bounds + expandBoundsForDisplay round-trip to the framed region (%s)',
    alignment => {
      const recorded = recordContentRegionBounds(
        createLinearMap(),
        alignment as ChapterAlignment
      );

      // The viewer expands the recorded bounds to compensate for the chapter
      // card: that must reproduce EXACTLY the camera the user framed (a raw
      // camera recording makes it display ~1.67x zoomed out).
      const displayed = expandBoundsForDisplay(
        recorded,
        alignment as ChapterAlignment
      );
      displayed.forEach((value, index) => {
        expect(value).toBeCloseTo(CAMERA_BOUNDS[index], 8);
      });
    }
  );

  test('a left card records the EASTERN strip of the camera as its content region', () => {
    const [w, s, e, n] = CAMERA_BOUNDS;
    const contentRange = (e - w) * CONTENT_REGION_FRACTION;

    const recorded = recordContentRegionBounds(createLinearMap(), 'left');
    [e - contentRange, s, e, n].forEach((value, index) => {
      expect(recorded[index]).toBeCloseTo(value, 8);
    });
  });

  test('a right card records the WESTERN strip of the camera as its content region', () => {
    const [w, s, e, n] = CAMERA_BOUNDS;
    const contentRange = (e - w) * CONTENT_REGION_FRACTION;

    const recorded = recordContentRegionBounds(createLinearMap(), 'right');
    [w, s, w + contentRange, n].forEach((value, index) => {
      expect(recorded[index]).toBeCloseTo(value, 8);
    });
  });
  // The just-modes record the FULL camera (no strip) is pinned once, above
  // ("content region is the full map for the just-modes") — no third copy
  // here.

  test('falls back to the raw camera bounds without map layout', () => {
    const map = createLinearMap({ clientWidth: 0, clientHeight: 0 });
    expect(recordContentRegionBounds(map, 'left')).toEqual(CAMERA_BOUNDS);
  });
});

describe('startTransition layer visibility', () => {
  test('a data layer with no transition events is hidden', () => {
    // Toggle-off leaves a mounted data layer whose generated events were
    // removed from every step: it must not stay visible at its last opacity.
    const config = {
      ...makeConfig({
        chapters: [
          {
            mapLayers: [],
          },
        ],
      }),
      dataLayers: {
        a: { id: 'a', title: 'A' },
      },
    } as unknown as StoryMapConfig;
    const map = createFakeMap(layerSublayerIds('a'));

    runTransition(map, config, 'chapter-1');

    expect(map.setPaintProperty).toHaveBeenCalledWith(
      'a-markers',
      'circle-opacity',
      0
    );
    expect(map.setPaintProperty).toHaveBeenCalledWith(
      'a-polygons-fill',
      'fill-opacity',
      0
    );
  });

  test('hiding unreferenced data layers does not disturb hand-authored layer fades', () => {
    const config = {
      ...makeConfig({
        chapters: [
          {
            mapLayers: [],
            onChapterEnter: [{ layer: 'layer1', opacity: 1, duration: 0 }],
            onChapterExit: [{ layer: 'layer1', opacity: 0, duration: 0 }],
          },
        ],
      }),
      dataLayers: {
        a: { id: 'a', title: 'A' },
      },
    } as unknown as StoryMapConfig;
    const map = createFakeMap(['layer1', ...layerSublayerIds('a')]);

    runTransition(map, config, 'chapter-1');

    // Hand-authored layer keeps its fade…
    expect(map.setPaintProperty).toHaveBeenCalledWith(
      'layer1',
      'fill-opacity',
      1
    );
    // …while the unreferenced data layer is hidden.
    expect(map.setPaintProperty).toHaveBeenCalledWith(
      'a-markers',
      'circle-opacity',
      0
    );
  });
});

describe('startTransition just-modes camera', () => {
  const locationConfig = (
    alignment: ChapterAlignment,
    overrides: Partial<Transition> = {}
  ) =>
    makeConfig({
      chapters: [
        {
          alignment,
          // The fixture carries a rotation: asserting "the hand-off is
          // skipped" without it was a tautology (map.once could not have
          // been called either way).
          rotateAnimation: true,
          location: {
            center: { lng: -79.9, lat: -2.4 },
            zoom: 5,
            pitch: 0,
            bearing: 0,
            bounds: [-80, -3, -79, -2],
          } as unknown as Transition['location'],
          ...overrides,
        },
      ],
    });

  test('skips the camera move for a justChapter chapter (the map is invisible)', () => {
    const map = createFakeMap();

    runTransition(map, locationConfig('justChapter'), 'chapter-1');

    expect(map.flyTo).not.toHaveBeenCalled();
    expect(map.easeTo).not.toHaveBeenCalled();
    // No map movement at all — the rotation hand-off is skipped too
    // (`rotateAnimation: true` is set on the fixture).
    expect(map.once).not.toHaveBeenCalled();
    expect(map.rotateTo).not.toHaveBeenCalled();
  });

  test('runs the camera move and the rotation hand-off for a justMap chapter (mirror)', () => {
    const map = createFakeMap();

    runTransition(map, locationConfig('justMap'), 'chapter-1');

    expect(map.flyTo).toHaveBeenCalled();
    // The rotation hand-off is registered on the next moveend.
    expect(map.once).toHaveBeenCalledWith('moveend', expect.any(Function));
  });

  test.each(['left', 'right', 'center'] as const)(
    'runs the camera move for %s chapters (unchanged)',
    alignment => {
      const map = createFakeMap();

      runTransition(map, locationConfig(alignment), 'chapter-1');

      expect(map.flyTo).toHaveBeenCalled();
    }
  );
});

describe('startTransition just-modes layer forcing', () => {
  const layerConfig = (alignment: ChapterAlignment) =>
    ({
      ...makeConfig({
        chapters: [
          {
            id: 'chapter-1',
            alignment,
            mapLayers: [{ layerId: 'a' }],
            dataLayerConfigId: 'a',
            onChapterEnter: [{ layer: 'a-markers', opacity: 1, duration: 0 }],
            onChapterExit: [{ layer: 'a-markers', opacity: 0, duration: 0 }],
          },
          {
            id: 'chapter-2',
            alignment: 'left',
            mapLayers: [{ layerId: 'a' }],
            dataLayerConfigId: 'a',
            onChapterEnter: [{ layer: 'a-markers', opacity: 1, duration: 0 }],
            onChapterExit: [{ layer: 'a-markers', opacity: 0, duration: 0 }],
          },
        ],
      }),
      dataLayers: { a: { id: 'a', title: 'A' } },
    }) as unknown as StoryMapConfig;

  test('forces every layer off while a justChapter chapter is active', () => {
    const map = createFakeMap(layerSublayerIds('a'));

    runTransition(map, layerConfig('justChapter'), 'chapter-1');

    for (const sublayer of layerSublayerIds('a')) {
      expect(map.setPaintProperty).toHaveBeenCalledWith(
        sublayer,
        expect.stringContaining('-opacity'),
        0
      );
    }
  });

  test('restores layer visibility for the chapters after a justChapter chapter', () => {
    const map = createFakeMap(layerSublayerIds('a'));
    const config = layerConfig('justChapter');

    runTransition(map, config, 'chapter-1');
    map.setPaintProperty.mockClear();
    runTransition(map, config, 'chapter-2');

    // The forcing is display-side only: the next chapter's normal layer
    // model drives the visibility again.
    expect(map.setPaintProperty).toHaveBeenCalledWith(
      'a-markers',
      'circle-opacity',
      1
    );
  });

  test('does not force layers off in the editing session (allowLayerForcing: false)', () => {
    const map = createFakeMap(layerSublayerIds('a'));

    runTransition(map, layerConfig('justChapter'), 'chapter-1', {
      allowLayerForcing: false,
    });

    expect(map.setPaintProperty).toHaveBeenCalledWith(
      'a-markers',
      'circle-opacity',
      1
    );
  });

  test('justMap chapters keep the normal layer visibility model', () => {
    const map = createFakeMap(layerSublayerIds('a'));

    runTransition(map, layerConfig('justMap'), 'chapter-1');

    expect(map.setPaintProperty).toHaveBeenCalledWith(
      'a-markers',
      'circle-opacity',
      1
    );
  });

  // K5 PRECEDENCE PIN: the layer model runs as authored (events accumulate
  // across steps); only the DISPLAY OUTPUT is overridden to 0 while the
  // active step is `justChapter`. A layer with `onChapterEnter` at a
  // `justChapter` chapter is hidden during it and visible from the next
  // chapter onward.
  test('a layer with onChapterEnter at a justChapter chapter is hidden during it and visible from the next chapter onward', () => {
    const map = createFakeMap(layerSublayerIds('a'));
    const config = {
      ...makeConfig({
        chapters: [
          {
            id: 'chapter-1',
            alignment: 'justChapter' as const,
            onChapterEnter: [{ layer: 'a-markers', opacity: 1, duration: 0 }],
          },
          { id: 'chapter-2', alignment: 'left' as const },
        ],
      }),
      dataLayers: { a: { id: 'a', title: 'A' } },
    } as unknown as StoryMapConfig;

    runTransition(map, config, 'chapter-1');

    // Hidden DURING the justChapter step (display override) …
    expect(map.setPaintProperty).toHaveBeenCalledWith(
      'a-markers',
      'circle-opacity',
      0
    );
    expect(map.setPaintProperty).not.toHaveBeenCalledWith(
      'a-markers',
      'circle-opacity',
      1
    );

    // …visible from the NEXT chapter onward (the authored event applies).
    map.setPaintProperty.mockClear();
    runTransition(map, config, 'chapter-2');
    expect(map.setPaintProperty).toHaveBeenCalledWith(
      'a-markers',
      'circle-opacity',
      1
    );
  });

  test('ALL layers forced off: every data sublayer and every hand-authored event layer goes to 0', () => {
    const map = createFakeMap([
      ...layerSublayerIds('a'),
      ...layerSublayerIds('b'),
      'hand-fill',
    ]);
    const config = {
      ...makeConfig({
        chapters: [
          {
            id: 'chapter-1',
            alignment: 'justChapter' as const,
            onChapterEnter: [{ layer: 'hand-fill', opacity: 1, duration: 0 }],
          },
        ],
      }),
      dataLayers: {
        a: { id: 'a', title: 'A' },
        b: { id: 'b', title: 'B' },
      },
    } as unknown as StoryMapConfig;

    runTransition(map, config, 'chapter-1');

    for (const sublayer of [
      ...layerSublayerIds('a'),
      ...layerSublayerIds('b'),
      'hand-fill',
    ]) {
      expect(map.setPaintProperty).toHaveBeenCalledWith(
        sublayer,
        expect.stringContaining('-opacity'),
        0
      );
    }
  });

  test('justChapter → justMap restores layer visibility (the spec-named sequence)', () => {
    const map = createFakeMap(layerSublayerIds('a'));
    const config = {
      ...makeConfig({
        chapters: [
          {
            id: 'chapter-1',
            alignment: 'justChapter' as const,
            onChapterEnter: [{ layer: 'a-markers', opacity: 1, duration: 0 }],
          },
          {
            id: 'chapter-2',
            alignment: 'justMap' as const,
            onChapterEnter: [{ layer: 'a-markers', opacity: 1, duration: 0 }],
          },
        ],
      }),
      dataLayers: { a: { id: 'a', title: 'A' } },
    } as unknown as StoryMapConfig;

    runTransition(map, config, 'chapter-1');
    map.setPaintProperty.mockClear();
    runTransition(map, config, 'chapter-2');

    expect(map.setPaintProperty).toHaveBeenCalledWith(
      'a-markers',
      'circle-opacity',
      1
    );
  });

  test('the forced-off display override is a concealment: duration 0, no inherited fade', () => {
    const map = createFakeMap(layerSublayerIds('a'));
    const config = {
      ...makeConfig({
        chapters: [
          {
            id: 'chapter-1',
            alignment: 'left' as const,
            onChapterEnter: [
              { layer: 'a-markers', opacity: 1, duration: 3000 },
            ],
          },
          { id: 'chapter-2', alignment: 'justChapter' as const },
        ],
      }),
      dataLayers: { a: { id: 'a', title: 'A' } },
    } as unknown as StoryMapConfig;

    runTransition(map, config, 'chapter-1');
    map.setPaintProperty.mockClear();
    runTransition(map, config, 'chapter-2');

    // Without duration: 0 the concealment would INHERIT the previous
    // event's 3000ms *-opacity-transition and fade instead of hiding.
    expect(map.setPaintProperty).toHaveBeenCalledWith(
      'a-markers',
      'circle-opacity-transition',
      { duration: 0 }
    );
    expect(map.setPaintProperty).toHaveBeenCalledWith(
      'a-markers',
      'circle-opacity',
      0
    );
  });

  test('hidden wins: a hidden justChapter chapter forces NOTHING off', () => {
    const map = createFakeMap(layerSublayerIds('a'));
    const config = {
      ...makeConfig({
        chapters: [
          {
            id: 'chapter-1',
            alignment: 'justChapter' as const,
            hidden: true,
            onChapterEnter: [{ layer: 'a-markers', opacity: 1, duration: 0 }],
          },
        ],
      }),
      dataLayers: { a: { id: 'a', title: 'A' } },
    } as unknown as StoryMapConfig;

    runTransition(map, config, 'chapter-1');

    expect(map.setPaintProperty).toHaveBeenCalledWith(
      'a-markers',
      'circle-opacity',
      1
    );
  });

  test('xs fallback: a justChapter chapter degrades to center semantics — layers are NOT forced', () => {
    const map = createFakeMap(layerSublayerIds('a'));

    runTransition(map, layerConfig('justChapter'), 'chapter-1', {
      isMobile: true,
    });

    expect(map.setPaintProperty).toHaveBeenCalledWith(
      'a-markers',
      'circle-opacity',
      1
    );
  });
});

describe('startTransition justChapter camera skip: in-flight rotation (K3)', () => {
  const config = makeConfig({
    chapters: [
      {
        id: 'chapter-1',
        alignment: 'justMap',
        rotateAnimation: true,
        location: {
          center: { lng: -79.9, lat: -2.4 },
          zoom: 5,
          pitch: 0,
          bearing: 0,
          bounds: [-80, -3, -79, -2],
        } as unknown as Transition['location'],
      },
      { id: 'chapter-2', alignment: 'justChapter' },
    ],
  });

  test('a pending rotate hand-off is dropped by the skip instead of detonating later', () => {
    const map = createFakeMap();

    // chapter-1 runs its camera and hands the 30s rotation to the NEXT
    // moveend — a long way out.
    runTransition(map, config, 'chapter-1');
    expect(map.once).toHaveBeenCalledWith('moveend', expect.any(Function));

    // Scrolling into the justChapter chapter skips its camera step — but a
    // bare early-return leaked the pending hand-off: the next moveend (e.g.
    // the camera INIT of the following chapter) would detonate the 30s
    // rotateTo and settle the map flipped.
    runTransition(map, config, 'chapter-2');
    expect(map.stop).toHaveBeenCalled();

    map.fire('moveend');
    expect(map.rotateTo).not.toHaveBeenCalled();
  });
});

describe('startTransition justChapter camera skip and resume (K8)', () => {
  const loc = () =>
    ({
      center: { lng: -79.9, lat: -2.4 },
      zoom: 5,
      pitch: 0,
      bearing: 0,
      bounds: [-80, -3, -79, -2],
    }) as unknown as Transition['location'];

  const config = makeConfig({
    chapters: [
      // first position: skipped
      { id: 'chapter-1', alignment: 'justChapter', location: loc() },
      // resume WITH a location (easeTo marks it as this one, not L1)
      {
        id: 'chapter-2',
        alignment: 'left',
        location: loc(),
        mapAnimation: 'easeTo',
      },
      // resume WITHOUT a location: the map must stay put
      { id: 'chapter-3', alignment: 'left' },
      // consecutive justChapter steps
      { id: 'chapter-4', alignment: 'justChapter', location: loc() },
      { id: 'chapter-5', alignment: 'justChapter', location: loc() },
      // last position: skipped
      { id: 'chapter-6', alignment: 'justChapter', location: loc() },
    ],
  });

  const clearCamera = (map: ReturnType<typeof createFakeMap>) => {
    map.flyTo.mockClear();
    map.easeTo.mockClear();
    map.stop.mockClear();
  };

  test('the camera resumes at the NEXT chapter with a location (its own move, not the skipped one)', () => {
    const map = createFakeMap();

    runTransition(map, config, 'chapter-1');
    expect(map.flyTo).not.toHaveBeenCalled();
    expect(map.easeTo).not.toHaveBeenCalled();

    clearCamera(map);
    runTransition(map, config, 'chapter-2');
    // mapAnimation: 'easeTo' on chapter-2's location marks the move as its
    // own — the skipped chapter-1 location would have been a flyTo.
    expect(map.easeTo).toHaveBeenCalled();
    expect(map.flyTo).not.toHaveBeenCalled();
  });

  test('a chapter WITHOUT a location leaves the map where it is (no snap back to the skipped camera)', () => {
    const map = createFakeMap();

    runTransition(map, config, 'chapter-1');
    clearCamera(map);
    runTransition(map, config, 'chapter-3');

    expect(map.flyTo).not.toHaveBeenCalled();
    expect(map.easeTo).not.toHaveBeenCalled();
  });

  test('consecutive justChapter chapters never move the map', () => {
    const map = createFakeMap();

    runTransition(map, config, 'chapter-4');
    runTransition(map, config, 'chapter-5');

    expect(map.flyTo).not.toHaveBeenCalled();
    expect(map.easeTo).not.toHaveBeenCalled();
  });

  test('the skip holds at the first and last chapter positions', () => {
    const map = createFakeMap();

    runTransition(map, config, 'chapter-1');
    runTransition(map, config, 'chapter-6');

    expect(map.flyTo).not.toHaveBeenCalled();
    expect(map.easeTo).not.toHaveBeenCalled();
    expect(map.stop).toHaveBeenCalled();
  });

  test('hidden wins: a hidden justChapter chapter runs its camera (no skip)', () => {
    const map = createFakeMap();
    const hiddenConfig = makeConfig({
      chapters: [
        {
          id: 'chapter-1',
          alignment: 'justChapter',
          hidden: true,
          location: loc(),
        },
      ],
    });

    runTransition(map, hiddenConfig, 'chapter-1');

    expect(map.flyTo).toHaveBeenCalled();
  });

  test('xs fallback: a justChapter chapter runs its camera (no skip)', () => {
    const map = createFakeMap();

    runTransition(map, config, 'chapter-1', { isMobile: true });

    expect(map.flyTo).toHaveBeenCalled();
  });

  test('the title step IGNORES a legacy titleTransition.alignment (the title has no alignment in the schema)', () => {
    const map = createFakeMap();
    const titleConfig = makeConfig({
      titleTransition: {
        // Legacy stored configs carry an alignment on the title transition.
        // The read path pins "ignore": the title step is a card, its camera
        // always runs (a stored justChapter there must not freeze the map).
        alignment: 'justChapter',
        location: loc(),
      } as unknown as Transition,
      chapters: [],
    });

    runTransition(map, titleConfig, STORY_MAP_TITLE_ID);

    expect(map.flyTo).toHaveBeenCalled();
  });
});
