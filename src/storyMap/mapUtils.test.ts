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
  enforceMapLayerOrder,
  startTransition,
} from 'terraso-web-client/storyMap/mapUtils';
import { STORY_MAP_TITLE_ID } from 'terraso-web-client/storyMap/storyMapConstants';
import {
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
  return {
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
    once: jest.fn(),
    off: jest.fn(),
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
  chapterId: string
) =>
  startTransition(map as never, {
    config,
    chapterId,
    mapDimensions: { width: 1200, height: 600 },
    isMobile: false,
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
