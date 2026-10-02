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

import { pruneUnusedDataLayers } from 'terraso-web-client/storyMap/components/StoryMapForm/storyMapConfigContext';
import {
  StoryMapConfig,
  Transition,
} from 'terraso-web-client/storyMap/storyMapTypes';

const dataLayer = (id: string) => ({ id, title: `Layer ${id}` });

const makeConfig = (overrides: Partial<StoryMapConfig> = {}): StoryMapConfig =>
  ({
    style: 'mapbox://styles/mapbox/streets-v12',
    themeId: 'theme-1',
    showMarkers: false,
    use3dTerrain: false,
    title: 'Test',
    subtitle: '',
    byline: '',
    chapters: [],
    dataLayers: {
      a: dataLayer('a'),
      b: dataLayer('b'),
      c: dataLayer('c'),
    },
    ...overrides,
  }) as unknown as StoryMapConfig;

describe('pruneUnusedDataLayers', () => {
  test('keeps layers referenced by chapter mapLayers', () => {
    const config = makeConfig({
      chapters: [
        {
          id: 'chapter-1',
          mapLayers: [{ layerId: 'a' }, { layerId: 'b' }],
        },
      ] as StoryMapConfig['chapters'],
    });

    const pruned = pruneUnusedDataLayers(config);

    expect(Object.keys(pruned.dataLayers ?? {}).sort()).toEqual(['a', 'b']);
  });

  test('keeps layers referenced by titleTransition mapLayers', () => {
    const config = makeConfig({
      titleTransition: {
        location: {},
        mapLayers: [{ layerId: 'c' }],
      } as unknown as Transition,
    });

    const pruned = pruneUnusedDataLayers(config);

    expect(Object.keys(pruned.dataLayers ?? {})).toEqual(['c']);
  });

  test('keeps layers referenced by legacy dataLayerConfigId', () => {
    const config = makeConfig({
      chapters: [
        { id: 'chapter-1', dataLayerConfigId: 'b' },
      ] as StoryMapConfig['chapters'],
    });

    const pruned = pruneUnusedDataLayers(config);

    expect(Object.keys(pruned.dataLayers ?? {})).toEqual(['b']);
  });

  test('drops layers not referenced anywhere', () => {
    const config = makeConfig({
      chapters: [
        {
          id: 'chapter-1',
          mapLayers: [{ layerId: 'a' }],
          dataLayerConfigId: 'a',
        },
      ] as StoryMapConfig['chapters'],
      titleTransition: {
        location: {},
        mapLayers: [],
      } as unknown as Transition,
    });

    const pruned = pruneUnusedDataLayers(config);

    expect(Object.keys(pruned.dataLayers ?? {})).toEqual(['a']);
  });

  test('strips fields the backend config schema rejects from stored data layers', () => {
    const config = makeConfig({
      chapters: [
        {
          id: 'chapter-1',
          mapLayers: [{ layerId: 'a' }],
        },
      ] as StoryMapConfig['chapters'],
      dataLayers: {
        a: {
          id: 'a',
          title: 'Layer A',
          ownerType: 'StoryMapNode',
          ownerId: 'owner-1',
          ownerName: 'Owner Name',
          dataEntry: { id: 'entry-1', name: 'file.geojson' },
          visualizeConfig: {
            shape: 'circle',
            opacity: 50,
            size: 15,
            color: '#fff',
          },
          geojsonSignedUrl: 'https://example.com/a.geojson',
        },
      } as unknown as StoryMapConfig['dataLayers'],
    });

    const pruned = pruneUnusedDataLayers(config);

    expect(pruned.dataLayers?.a).toEqual({
      id: 'a',
      title: 'Layer A',
      ownerType: 'StoryMapNode',
      visualizeConfig: {
        shape: 'circle',
        opacity: 50,
        size: 15,
        color: '#fff',
      },
      geojsonSignedUrl: 'https://example.com/a.geojson',
    });
  });
});
