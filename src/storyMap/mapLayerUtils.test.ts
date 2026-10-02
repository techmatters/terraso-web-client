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
  addMapLayerToTransition,
  generateLayerTransitionEvents,
  removeMapLayerFromTransition,
  reorderTransitionMapLayers,
  resolveMapLayers,
} from 'terraso-web-client/storyMap/mapLayerUtils';
import {
  MapLayerConfig,
  Transition,
} from 'terraso-web-client/storyMap/storyMapTypes';

const makeLayerConfig = (
  id: string,
  options: { fillOpacity?: number; title?: string } = {}
): MapLayerConfig =>
  ({
    id,
    title: options.title ?? `Layer ${id}`,
    visualizeConfig: {
      shape: 'circle',
      size: 15,
      color: '#000000',
      opacity: options.fillOpacity ?? 50,
    },
  }) as unknown as MapLayerConfig;

const layerA = makeLayerConfig('a', { fillOpacity: 50 });
const layerB = makeLayerConfig('b', { fillOpacity: 25 });
const layerC = makeLayerConfig('c', { fillOpacity: 80 });

const configsById: Record<string, MapLayerConfig> = {
  a: layerA,
  b: layerB,
  c: layerC,
};
const resolveConfig = (layerId: string) => configsById[layerId];

const eventLayers = (events: { layer: string }[] = []) =>
  events.map(event => event.layer).sort();

describe('resolveMapLayers (legacy read fallback)', () => {
  test('returns empty list for a transition without layers', () => {
    expect(resolveMapLayers({} as Transition)).toEqual([]);
  });

  test('falls back to dataLayerConfigId when mapLayers is absent', () => {
    expect(resolveMapLayers({ dataLayerConfigId: 'a' } as Transition)).toEqual([
      { layerId: 'a' },
    ]);
  });

  test('uses mapLayers when present, keeping topmost-first order', () => {
    const mapLayers = [{ layerId: 'b' }, { layerId: 'a' }];
    expect(
      resolveMapLayers({
        mapLayers,
        dataLayerConfigId: 'a',
      } as Transition)
    ).toEqual(mapLayers);
  });

  test('mapLayers present as empty array wins over legacy dataLayerConfigId', () => {
    expect(
      resolveMapLayers({
        mapLayers: [],
        dataLayerConfigId: 'a',
      } as unknown as Transition)
    ).toEqual([]);
  });
});

describe('generateLayerTransitionEvents', () => {
  test('generates enter/exit events for every layer in mapLayers', () => {
    const { onChapterEnter, onChapterExit } = generateLayerTransitionEvents(
      [{ layerId: 'a' }, { layerId: 'b' }],
      resolveConfig
    );

    expect(eventLayers(onChapterEnter)).toEqual([
      'a-markers',
      'a-polygons-fill',
      'a-polygons-outline',
      'b-markers',
      'b-polygons-fill',
      'b-polygons-outline',
    ]);
    expect(eventLayers(onChapterExit)).toEqual(eventLayers(onChapterEnter));
  });

  test('enter events use per-layer-type opacities, exit events fade to 0', () => {
    const { onChapterEnter, onChapterExit } = generateLayerTransitionEvents(
      [{ layerId: 'a' }],
      resolveConfig
    );

    expect(onChapterEnter).toEqual(
      expect.arrayContaining([
        { layer: 'a-markers', opacity: 1, duration: 0 },
        { layer: 'a-polygons-outline', opacity: 1, duration: 0 },
        { layer: 'a-polygons-fill', opacity: 0.5, duration: 0 },
      ])
    );
    expect(onChapterExit).toEqual(
      expect.arrayContaining([
        { layer: 'a-markers', opacity: 0, duration: 0 },
        { layer: 'a-polygons-outline', opacity: 0, duration: 0 },
        { layer: 'a-polygons-fill', opacity: 0, duration: 0 },
      ])
    );
  });

  test('emits no events when there are no layers', () => {
    const { onChapterEnter, onChapterExit } = generateLayerTransitionEvents(
      [],
      resolveConfig
    );
    expect(onChapterEnter).toEqual([]);
    expect(onChapterExit).toEqual([]);
  });
});

describe('addMapLayerToTransition', () => {
  test('prepends the layer (index 0 = topmost)', () => {
    const transition: Transition = {
      location: {} as Transition['location'],
      mapLayers: [{ layerId: 'a' }],
      dataLayerConfigId: 'a',
    };

    const updated = addMapLayerToTransition(transition, layerB, resolveConfig);

    expect(updated.mapLayers).toEqual([{ layerId: 'b' }, { layerId: 'a' }]);
  });

  test('sets dataLayerConfigId to the newly added layer', () => {
    const transition: Transition = {
      location: {} as Transition['location'],
      mapLayers: [{ layerId: 'a' }],
      dataLayerConfigId: 'a',
    };

    const updated = addMapLayerToTransition(transition, layerB, resolveConfig);

    expect(updated.dataLayerConfigId).toBe('b');
  });

  test('regenerates enter/exit events for ALL layers', () => {
    const transition: Transition = {
      location: {} as Transition['location'],
      mapLayers: [{ layerId: 'a' }],
      dataLayerConfigId: 'a',
    };

    const updated = addMapLayerToTransition(transition, layerB, resolveConfig);

    expect(eventLayers(updated.onChapterEnter)).toEqual([
      'a-markers',
      'a-polygons-fill',
      'a-polygons-outline',
      'b-markers',
      'b-polygons-fill',
      'b-polygons-outline',
    ]);
    // per-layer-type opacities are kept for the pre-existing layer too
    expect(updated.onChapterEnter).toEqual(
      expect.arrayContaining([
        { layer: 'a-polygons-fill', opacity: 0.5, duration: 0 },
        { layer: 'b-polygons-fill', opacity: 0.25, duration: 0 },
      ])
    );
    expect(updated.onChapterExit?.every(event => event.opacity === 0)).toBe(
      true
    );
  });

  test('works on a legacy transition without mapLayers', () => {
    const transition: Transition = {
      location: {} as Transition['location'],
      dataLayerConfigId: 'a',
    };

    const updated = addMapLayerToTransition(transition, layerB, resolveConfig);

    expect(updated.mapLayers).toEqual([{ layerId: 'b' }, { layerId: 'a' }]);
    expect(updated.dataLayerConfigId).toBe('b');
  });

  test('moves an already-present layer to the top instead of duplicating it', () => {
    const transition: Transition = {
      location: {} as Transition['location'],
      mapLayers: [{ layerId: 'b' }, { layerId: 'a' }],
      dataLayerConfigId: 'a',
    };

    const updated = addMapLayerToTransition(transition, layerA, resolveConfig);

    expect(updated.mapLayers).toEqual([{ layerId: 'a' }, { layerId: 'b' }]);
  });

  test('preserves unrelated transition fields (location, alignment, media…)', () => {
    const transition = {
      id: 'chapter-1',
      title: 'Chapter',
      location: { zoom: 4 },
    } as unknown as Transition;

    const updated = addMapLayerToTransition(transition, layerA, resolveConfig);

    expect(updated).toMatchObject({
      id: 'chapter-1',
      title: 'Chapter',
      location: { zoom: 4 },
    });
  });
});

describe('removeMapLayerFromTransition', () => {
  test('drops the layer and regenerates events for the remaining layers', () => {
    const transition: Transition = {
      location: {} as Transition['location'],
      mapLayers: [{ layerId: 'b' }, { layerId: 'a' }],
      dataLayerConfigId: 'b',
    };

    const updated = removeMapLayerFromTransition(
      transition,
      'b',
      resolveConfig
    );

    expect(updated.mapLayers).toEqual([{ layerId: 'a' }]);
    expect(eventLayers(updated.onChapterEnter)).toEqual([
      'a-markers',
      'a-polygons-fill',
      'a-polygons-outline',
    ]);
    expect(updated.onChapterExit?.every(event => event.opacity === 0)).toBe(
      true
    );
  });

  test('repoints dataLayerConfigId to the remaining topmost layer', () => {
    const transition: Transition = {
      location: {} as Transition['location'],
      mapLayers: [{ layerId: 'b' }, { layerId: 'a' }],
      dataLayerConfigId: 'b',
    };

    const updated = removeMapLayerFromTransition(
      transition,
      'b',
      resolveConfig
    );

    expect(updated.dataLayerConfigId).toBe('a');
  });

  test('keeps dataLayerConfigId when it points at another layer', () => {
    const transition: Transition = {
      location: {} as Transition['location'],
      mapLayers: [{ layerId: 'b' }, { layerId: 'a' }],
      dataLayerConfigId: 'a',
    };

    const updated = removeMapLayerFromTransition(
      transition,
      'b',
      resolveConfig
    );

    expect(updated.dataLayerConfigId).toBe('a');
  });

  test('clears dataLayerConfigId when no layers remain', () => {
    const transition: Transition = {
      location: {} as Transition['location'],
      mapLayers: [{ layerId: 'a' }],
      dataLayerConfigId: 'a',
    };

    const updated = removeMapLayerFromTransition(
      transition,
      'a',
      resolveConfig
    );

    expect(updated.mapLayers).toEqual([]);
    expect(updated.dataLayerConfigId).toBeUndefined();
    expect(updated.onChapterEnter).toEqual([]);
    expect(updated.onChapterExit).toEqual([]);
  });
});

describe('reorderTransitionMapLayers', () => {
  test('only changes the mapLayers order', () => {
    const transition: Transition = {
      location: {} as Transition['location'],
      mapLayers: [{ layerId: 'a' }, { layerId: 'b' }, { layerId: 'c' }],
      dataLayerConfigId: 'b',
      onChapterEnter: [{ layer: 'a-markers', opacity: 1, duration: 0 }],
      onChapterExit: [{ layer: 'a-markers', opacity: 0, duration: 0 }],
    };

    const updated = reorderTransitionMapLayers(transition, [
      { layerId: 'c' },
      { layerId: 'a' },
      { layerId: 'b' },
    ]);

    expect(updated.mapLayers).toEqual([
      { layerId: 'c' },
      { layerId: 'a' },
      { layerId: 'b' },
    ]);
    expect(updated.dataLayerConfigId).toBe('b');
    expect(updated.onChapterEnter).toBe(transition.onChapterEnter);
    expect(updated.onChapterExit).toBe(transition.onChapterExit);
  });
});
