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

import { act, render, screen } from 'terraso-web-client/tests/utils';

import {
  pruneUnusedDataLayers,
  sanitizeDataLayerConfig,
  StoryMapConfigContextProvider,
  useStoryMapConfigActionsContext,
  useStoryMapConfigDataContext,
  useStoryMapSaveContext,
} from 'terraso-web-client/storyMap/components/StoryMapForm/storyMapConfigContext';
// Golden config fixture. Duplicated verbatim in
// backend/terraso_backend/tests/story_map/fixtures/story_map_config.golden.json
// (the backend twin asserts validate_story_map_config(fixture) == []); keep
// both copies in sync.
import goldenConfig from 'terraso-web-client/storyMap/fixtures/storyMapConfig.golden.json';
import {
  MapLayerConfig,
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

describe('golden story map config fixture', () => {
  test('pruneUnusedDataLayers round-trips it unchanged', () => {
    const pruned = pruneUnusedDataLayers(
      goldenConfig as unknown as StoryMapConfig
    );

    expect(pruned).toEqual(goldenConfig);
  });
});

describe('sanitizeDataLayerConfig', () => {
  test('drops nested fields the backend config schema rejects', () => {
    const sanitized = sanitizeDataLayerConfig({
      id: 'a',
      title: 'Layer A',
      ownerId: 'owner-1',
      ownerName: 'Owner Name',
      dataEntry: { id: 'entry-1', name: 'file.geojson' },
      createdBy: {
        id: 'user-1',
        firstName: 'First',
        lastName: 'Last',
        email: 'user@example.com',
        __typename: 'UserNode',
      },
      visualizeConfig: {
        shape: 'circle',
        opacity: 50,
        size: 15,
        color: '#fff',
        mapboxPaint: { 'fill-opacity': 0.5 },
      },
      annotateConfig: {
        dataPoints: [],
        mapTitle: 'Title',
        dataPointsTitle: 'x',
      },
      datasetConfig: { latitude: 'lat', longitude: 'lng', preview: {} },
      viewportConfig: {
        bounds: {
          northEast: { lat: 1, lng: 2, extra: true },
          southWest: { lat: 0, lng: 0 },
        },
        baseMapStyle: 'mapbox://styles/mapbox/light-v11',
        fitBounds: {},
      },
    } as unknown as MapLayerConfig);

    expect(sanitized).toEqual({
      id: 'a',
      title: 'Layer A',
      createdBy: { id: 'user-1', firstName: 'First', lastName: 'Last' },
      visualizeConfig: {
        shape: 'circle',
        opacity: 50,
        size: 15,
        color: '#fff',
      },
      annotateConfig: { dataPoints: [], mapTitle: 'Title' },
      datasetConfig: { latitude: 'lat', longitude: 'lng' },
      viewportConfig: {
        bounds: {
          northEast: { lat: 1, lng: 2 },
          southWest: { lat: 0, lng: 0 },
        },
        baseMapStyle: 'mapbox://styles/mapbox/light-v11',
      },
    });
  });
});

type HarnessActions = {
  getConfig: () => StoryMapConfig;
  setConfig: (_: unknown) => void;
  registerSessionDataLayers: (_: string[]) => void;
  getConfigForSave: (_: StoryMapConfig) => StoryMapConfig;
};

const makeHarness = () => {
  let actions: HarnessActions;
  const Probe = () => {
    const { config } = useStoryMapConfigDataContext() as {
      config: StoryMapConfig;
    };
    const configActions = useStoryMapConfigActionsContext() as {
      setConfig: (_: unknown) => void;
      registerSessionDataLayers: (_: string[]) => void;
    };
    const saveActions = useStoryMapSaveContext() as {
      getConfigForSave: (_: StoryMapConfig) => StoryMapConfig;
    };
    actions = {
      getConfig: () => config,
      setConfig: configActions.setConfig,
      registerSessionDataLayers: configActions.registerSessionDataLayers,
      getConfigForSave: saveActions.getConfigForSave,
    };
    return (
      <div
        data-testid="probe"
        data-layer-ids={JSON.stringify(
          Object.keys(config.dataLayers ?? {}).sort()
        )}
      />
    );
  };
  return { Probe, getActions: () => actions };
};

const setupHarness = async () => {
  const harness = makeHarness();
  await render(
    <StoryMapConfigContextProvider
      baseConfig={makeConfig()}
      storyMap={{ id: 'story-map-1' }}
    >
      <harness.Probe />
    </StoryMapConfigContextProvider>
  );
  return harness;
};

const probeLayerIds = () =>
  JSON.parse(
    screen.getByTestId('probe').getAttribute('data-layer-ids') ?? '[]'
  ) as string[];

describe('commit contract: pruning runs at the save boundary only', () => {
  test('a session-created layer survives detaching + saving (never destroyed)', async () => {
    const { getActions } = await setupHarness();
    const actions = getActions();

    // Create: commit the layer immediately and attach it to a chapter.
    await act(async () => {
      actions.registerSessionDataLayers(['created']);
      actions.setConfig((config: StoryMapConfig) => ({
        ...config,
        dataLayers: {
          ...config.dataLayers,
          created: {
            id: 'created',
            title: 'Created Layer',
            ownerType: 'StoryMapNode',
            ownerId: 'owner-1',
            ownerName: 'Owner Name',
          } as MapLayerConfig,
        },
        chapters: [
          {
            id: 'chapter-1',
            mapLayers: [{ layerId: 'created' }],
          } as unknown as StoryMapConfig['chapters'][number],
        ],
      }));
    });
    expect(probeLayerIds()).toContain('created');

    // Remove the layer from the chapter…
    await act(async () => {
      actions.setConfig((config: StoryMapConfig) => ({
        ...config,
        chapters: [
          {
            id: 'chapter-1',
            mapLayers: [],
          } as unknown as StoryMapConfig['chapters'][number],
        ],
      }));
    });

    // …it is NOT garbage-collected on update…
    expect(probeLayerIds()).toContain('created');

    // …nor at the save boundary: the asset stays available (session-created
    // exemption), sanitized to the stored schema shape.
    // getActions() again: the probe re-renders with a fresh closure per update.
    const saved = getActions().getConfigForSave(getActions().getConfig());
    expect(saved.dataLayers?.created).toEqual({
      id: 'created',
      title: 'Created Layer',
      ownerType: 'StoryMapNode',
    });
  });

  test('unreferenced layers are pruned at the save boundary only', async () => {
    const { getActions } = await setupHarness();
    const actions = getActions();

    await act(async () => {
      actions.setConfig((config: StoryMapConfig) => ({
        ...config,
        dataLayers: {
          ...config.dataLayers,
          temp: { id: 'temp', title: 'Temp Layer' } as MapLayerConfig,
        },
        chapters: [
          {
            id: 'chapter-1',
            mapLayers: [{ layerId: 'temp' }],
          } as unknown as StoryMapConfig['chapters'][number],
        ],
      }));
    });
    await act(async () => {
      actions.setConfig((config: StoryMapConfig) => ({
        ...config,
        chapters: [
          {
            id: 'chapter-1',
            mapLayers: [],
          } as unknown as StoryMapConfig['chapters'][number],
        ],
      }));
    });

    // Not GC'd mid-edit…
    expect(probeLayerIds()).toContain('temp');

    // …but pruned at the save boundary (no session exemption registered).
    const saved = getActions().getConfigForSave(getActions().getConfig());
    expect(saved.dataLayers ?? {}).toEqual({});
  });
});

describe('structural sharing: unchanged data keeps its identity', () => {
  test('sanitizeDataLayerConfig is identity-stable for sanitized configs', () => {
    const layer = {
      id: 'a',
      title: 'Layer A',
      viewportConfig: {
        bounds: {
          northEast: { lat: 1, lng: 2 },
          southWest: { lat: 0, lng: 0 },
        },
        baseMapStyle: 'mapbox://styles/mapbox/light-v11',
      },
    } as unknown as MapLayerConfig;

    const sanitized = sanitizeDataLayerConfig(layer);
    const resanitized = sanitizeDataLayerConfig(sanitized);

    // The layer fit effect keys on the bounds object identity: rebuilding
    // deep-equal objects on every write re-runs the fit (and the camera
    // recorder saves the fit as the user's camera).
    expect(resanitized).toBe(sanitized);
    expect(resanitized.viewportConfig).toBe(sanitized.viewportConfig);
    expect(resanitized.viewportConfig?.bounds).toBe(
      sanitized.viewportConfig?.bounds
    );
  });

  test('a camera write keeps dataLayers and bounds identity', async () => {
    const { getActions } = await setupHarness();
    await act(async () => {
      getActions().setConfig((config: StoryMapConfig) => ({
        ...config,
        dataLayers: {
          ...config.dataLayers,
          fitted: {
            id: 'fitted',
            title: 'Fitted',
            viewportConfig: {
              bounds: {
                northEast: { lat: 1, lng: 2 },
                southWest: { lat: 0, lng: 0 },
              },
            },
          } as unknown as MapLayerConfig,
        },
        chapters: [
          { id: 'chapter-1', mapLayers: [{ layerId: 'fitted' }] },
        ] as unknown as StoryMapConfig['chapters'],
      }));
    });

    const before = getActions().getConfig();

    // An UNRELATED write (the camera recorder's location write) must not
    // rebuild the data layer configs.
    await act(async () => {
      getActions().setConfig((config: StoryMapConfig) => ({
        ...config,
        chapters: config.chapters.map(chapter =>
          chapter.id === 'chapter-1'
            ? {
                ...chapter,
                location: {
                  center: { lng: 1, lat: 1 },
                  zoom: 5,
                  pitch: 0,
                  bearing: 0,
                  bounds: [0, 0, 2, 2],
                },
              }
            : chapter
        ),
      }));
    });

    const after = getActions().getConfig();
    const boundsOf = (config: StoryMapConfig) =>
      (
        config.dataLayers?.fitted as unknown as {
          viewportConfig?: { bounds?: unknown };
        }
      )?.viewportConfig?.bounds;
    expect(after).not.toBe(before);
    expect(after.dataLayers).toBe(before.dataLayers);
    expect(after.dataLayers?.fitted).toBe(before.dataLayers?.fitted);
    expect(boundsOf(after)).toBe(boundsOf(before));
  });
});
