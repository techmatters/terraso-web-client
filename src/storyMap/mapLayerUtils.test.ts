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

import logger from 'terraso-client-shared/monitoring/logger';

import {
  addMapLayerId,
  generateLayerTransitionEvents,
  isDataLayerSublayerId,
  moveMapLayerId,
  removeMapLayerId,
  resolveMapLayers,
  syncTransitionLayerFields,
  toMapLayers,
} from 'terraso-web-client/storyMap/mapLayerUtils';
import {
  MapLayerConfig,
  Transition,
} from 'terraso-web-client/storyMap/storyMapTypes';

jest.mock('terraso-client-shared/monitoring/logger', () => ({
  __esModule: true,
  default: {
    log: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

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

  test('skips unresolvable layers instead of baking in a placeholder opacity', () => {
    const { onChapterEnter, onChapterExit } = generateLayerTransitionEvents(
      [{ layerId: 'a' }, { layerId: 'ghost' }],
      resolveConfig
    );

    expect(eventLayers(onChapterEnter)).toEqual([
      'a-markers',
      'a-polygons-fill',
      'a-polygons-outline',
    ]);
    expect(onChapterEnter).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ layer: 'ghost-polygons-fill' }),
      ])
    );
    expect(eventLayers(onChapterExit)).toEqual(eventLayers(onChapterEnter));
    expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining('ghost'));
  });
});

describe('isDataLayerSublayerId', () => {
  test('matches generated sublayer ids only', () => {
    expect(isDataLayerSublayerId('a-markers')).toBe(true);
    expect(isDataLayerSublayerId('a-polygons-outline')).toBe(true);
    expect(isDataLayerSublayerId('a-polygons-fill')).toBe(true);
    expect(isDataLayerSublayerId('water')).toBe(false);
    expect(isDataLayerSublayerId('road-label')).toBe(false);
  });
});

describe('ordered layer id list operations', () => {
  test('addMapLayerId prepends (index 0 = topmost) and dedupes', () => {
    expect(addMapLayerId(['a'], 'b')).toEqual(['b', 'a']);
    expect(addMapLayerId(['b', 'a'], 'a')).toEqual(['a', 'b']);
    expect(addMapLayerId([], 'a')).toEqual(['a']);
  });

  test('removeMapLayerId drops the layer and keeps the rest ordered', () => {
    expect(removeMapLayerId(['b', 'a'], 'b')).toEqual(['a']);
    expect(removeMapLayerId(['b', 'a'], 'x')).toEqual(['b', 'a']);
  });

  test('moveMapLayerId moves by index (drag reorder semantics)', () => {
    expect(moveMapLayerId(['a', 'b', 'c'], 0, 2)).toEqual(['b', 'c', 'a']);
    expect(moveMapLayerId(['a', 'b', 'c'], 2, 0)).toEqual(['c', 'a', 'b']);
  });

  test('toMapLayers maps ids to mapLayers refs', () => {
    expect(toMapLayers(['b', 'a'])).toEqual([
      { layerId: 'b' },
      { layerId: 'a' },
    ]);
    expect(toMapLayers([])).toEqual([]);
  });
});

describe('syncTransitionLayerFields', () => {
  test('regenerates events for ALL layers of mapLayers', () => {
    const transition: Transition = {
      location: {} as Transition['location'],
      mapLayers: [{ layerId: 'a' }, { layerId: 'b' }],
      dataLayerConfigId: 'a',
    };

    const derived = syncTransitionLayerFields(transition, resolveConfig);

    expect(eventLayers(derived.onChapterEnter)).toEqual([
      'a-markers',
      'a-polygons-fill',
      'a-polygons-outline',
      'b-markers',
      'b-polygons-fill',
      'b-polygons-outline',
    ]);
    expect(derived.onChapterEnter).toEqual(
      expect.arrayContaining([
        { layer: 'a-polygons-fill', opacity: 0.5, duration: 0 },
        { layer: 'b-polygons-fill', opacity: 0.25, duration: 0 },
      ])
    );
    expect(derived.onChapterExit?.every(event => event.opacity === 0)).toBe(
      true
    );
  });

  test('drops stale generated entries for removed layers', () => {
    const transition: Transition = {
      location: {} as Transition['location'],
      mapLayers: [{ layerId: 'a' }],
      dataLayerConfigId: 'a',
      onChapterEnter: [
        { layer: 'a-markers', opacity: 1, duration: 0 },
        { layer: 'b-markers', opacity: 1, duration: 0 },
        { layer: 'b-polygons-fill', opacity: 0.25, duration: 0 },
      ],
      onChapterExit: [
        { layer: 'a-markers', opacity: 0, duration: 0 },
        { layer: 'b-markers', opacity: 0, duration: 0 },
      ],
    };

    const derived = syncTransitionLayerFields(transition, resolveConfig);

    expect(eventLayers(derived.onChapterEnter)).toEqual([
      'a-markers',
      'a-polygons-fill',
      'a-polygons-outline',
    ]);
    expect(eventLayers(derived.onChapterExit)).toEqual([
      'a-markers',
      'a-polygons-fill',
      'a-polygons-outline',
    ]);
  });

  test('preserves hand-authored non-layer event entries', () => {
    const transition: Transition = {
      location: {} as Transition['location'],
      mapLayers: [{ layerId: 'a' }],
      dataLayerConfigId: 'a',
      onChapterEnter: [
        { layer: 'water', opacity: 0, duration: 0.5 },
        { layer: 'a-markers', opacity: 1, duration: 0 },
      ],
      onChapterExit: [{ layer: 'water', opacity: 1, duration: 0.5 }],
    };

    const derived = syncTransitionLayerFields(transition, resolveConfig);

    expect(derived.onChapterEnter).toEqual(
      expect.arrayContaining([
        { layer: 'water', opacity: 0, duration: 0.5 },
        { layer: 'a-markers', opacity: 1, duration: 0 },
      ])
    );
    expect(eventLayers(derived.onChapterEnter)).toEqual([
      'a-markers',
      'a-polygons-fill',
      'a-polygons-outline',
      'water',
    ]);
    expect(derived.onChapterExit).toEqual(
      expect.arrayContaining([{ layer: 'water', opacity: 1, duration: 0.5 }])
    );
    expect(eventLayers(derived.onChapterExit)).toEqual([
      'a-markers',
      'a-polygons-fill',
      'a-polygons-outline',
      'water',
    ]);
  });

  test('dataLayerConfigId points at the most recently added layer', () => {
    const transition: Transition = {
      location: {} as Transition['location'],
      mapLayers: [{ layerId: 'b' }, { layerId: 'a' }],
      dataLayerConfigId: 'a',
    };

    // layer b was just added at the top; previous state was [a]
    const derived = syncTransitionLayerFields(transition, resolveConfig, {
      mapLayers: [{ layerId: 'a' }],
      dataLayerConfigId: 'a',
    });

    expect(derived.dataLayerConfigId).toBe('b');
  });

  test('keeps dataLayerConfigId across a reorder', () => {
    const transition: Transition = {
      location: {} as Transition['location'],
      mapLayers: [{ layerId: 'c' }, { layerId: 'a' }, { layerId: 'b' }],
      dataLayerConfigId: 'b',
    };

    const derived = syncTransitionLayerFields(transition, resolveConfig, {
      mapLayers: [{ layerId: 'a' }, { layerId: 'b' }, { layerId: 'c' }],
      dataLayerConfigId: 'b',
    });

    expect(derived.dataLayerConfigId).toBe('b');
  });

  test('repoints dataLayerConfigId to the topmost remaining layer on removal', () => {
    const transition: Transition = {
      location: {} as Transition['location'],
      mapLayers: [{ layerId: 'a' }],
    };

    const derived = syncTransitionLayerFields(transition, resolveConfig, {
      mapLayers: [{ layerId: 'b' }, { layerId: 'a' }],
      dataLayerConfigId: 'b',
    });

    expect(derived.dataLayerConfigId).toBe('a');
  });

  test('keeps dataLayerConfigId when it points at another remaining layer', () => {
    const transition: Transition = {
      location: {} as Transition['location'],
      mapLayers: [{ layerId: 'b' }, { layerId: 'a' }],
      dataLayerConfigId: 'a',
    };

    const derived = syncTransitionLayerFields(transition, resolveConfig, {
      mapLayers: [{ layerId: 'b' }, { layerId: 'a' }, { layerId: 'c' }],
      dataLayerConfigId: 'a',
    });

    expect(derived.dataLayerConfigId).toBe('a');
  });

  test('clears dataLayerConfigId when the last layer is removed', () => {
    const transition: Transition = {
      location: {} as Transition['location'],
      mapLayers: [],
    };

    const derived = syncTransitionLayerFields(transition, resolveConfig, {
      mapLayers: [{ layerId: 'a' }],
      dataLayerConfigId: 'a',
    });

    expect(derived.dataLayerConfigId).toBeUndefined();
    expect(derived.onChapterEnter).toEqual([]);
    expect(derived.onChapterExit).toEqual([]);
  });

  test('leaves legacy transitions without mapLayers untouched (no migration)', () => {
    const transition: Transition = {
      location: {} as Transition['location'],
      dataLayerConfigId: 'a',
      onChapterEnter: [{ layer: 'layer1', opacity: 1, duration: 0 }],
      onChapterExit: [{ layer: 'layer1', opacity: 0, duration: 0 }],
    };

    const derived = syncTransitionLayerFields(transition, resolveConfig);

    expect(derived).toEqual({});
  });

  test('keeps dangling layer refs out of the generated events (resolver miss)', () => {
    const transition: Transition = {
      location: {} as Transition['location'],
      mapLayers: [{ layerId: 'a' }, { layerId: 'ghost' }],
      dataLayerConfigId: 'a',
    };

    const derived = syncTransitionLayerFields(transition, resolveConfig);

    expect(eventLayers(derived.onChapterEnter)).toEqual([
      'a-markers',
      'a-polygons-fill',
      'a-polygons-outline',
    ]);
    expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining('ghost'));
  });
});
