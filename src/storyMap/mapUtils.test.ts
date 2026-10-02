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
  const layers = new Set(layerIds);
  return {
    moveLayer: jest.fn(),
    getStyle: () => ({ layers: [...layers].map(id => ({ id })) }),
    getLayer: (id: string) => {
      if (!layers.has(id)) {
        return undefined;
      }
      if (id.endsWith('-markers')) {
        return { type: 'circle' };
      }
      if (id.endsWith('-polygons-outline')) {
        return { type: 'line' };
      }
      return { type: 'fill' };
    },
    setPaintProperty: jest.fn(),
    flyTo: jest.fn(),
    easeTo: jest.fn(),
    once: jest.fn(),
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

    // moveLayer moves to the top, so layers are moved bottom-first:
    // layer a (bottom) fully before layer b (top)
    expect(map.moveLayer.mock.calls.map(([id]: [string]) => id)).toEqual([
      'a-markers',
      'a-polygons-outline',
      'a-polygons-fill',
      'b-markers',
      'b-polygons-outline',
      'b-polygons-fill',
    ]);
  });

  test('skips sublayers that are not on the map yet', () => {
    const map = createFakeMap(['a-markers']);

    enforceMapLayerOrder(map as never, [{ layerId: 'b' }, { layerId: 'a' }]);

    expect(map.moveLayer.mock.calls.map(([id]: [string]) => id)).toEqual([
      'a-markers',
    ]);
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

    expect(map.moveLayer.mock.calls.map(([id]: [string]) => id)).toEqual([
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

    expect(map.moveLayer.mock.calls.map(([id]: [string]) => id)).toEqual([
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
