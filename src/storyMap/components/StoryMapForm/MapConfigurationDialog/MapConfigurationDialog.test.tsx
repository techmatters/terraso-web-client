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
  act,
  fireEvent,
  render,
  RenderResult,
  screen,
  waitFor,
  within,
} from 'terraso-web-client/tests/utils';
import * as terrasoApi from 'terraso-client-shared/terrasoApi/api';
import {
  createTestPosition,
  createTestStoryMap,
  createTestStoryMapConfig,
  createTestVisualizationConfigNode,
} from 'terraso-web-client/tests/data/storyMap';

import * as visualizationUtils from 'terraso-web-client/sharedData/visualization/visualizationUtils';
import { MapConfigurationDialog } from 'terraso-web-client/storyMap/components/StoryMapForm/MapConfigurationDialog/MapConfigurationDialog';
import { MAP_LAYER_CREATE_PREVIEW_ID } from 'terraso-web-client/storyMap/components/StoryMapForm/MapConfigurationDialog/MapLayerCreateSession';
import {
  StoryMapConfigContextProvider,
  useStoryMapConfigDataContext,
} from 'terraso-web-client/storyMap/components/StoryMapForm/storyMapConfigContext';
import { enforceMapLayerOrder } from 'terraso-web-client/storyMap/mapUtils';
import {
  MapLayerConfig,
  MapLayerTransition,
  StoryMapConfig,
} from 'terraso-web-client/storyMap/storyMapTypes';

import theme from 'terraso-web-client/theme';

// Mock terrasoApi at the network boundary
jest.mock('terraso-client-shared/terrasoApi/api');

// Set up mocks BEFORE importing components
let mockMap: any;
jest.mock('terraso-web-client/gis/components/Map', () => {
  const { forwardRef } = jest.requireActual('react');
  return {
    __esModule: true,
    default: forwardRef(function MockMap(
      { children }: { children: any },
      _ref: unknown
    ) {
      return <div data-testid="mock-map">{children}</div>;
    }),
    useMap: () => ({ map: mockMap }),
  };
});

jest.mock('terraso-web-client/storyMap/components/StoryMapLayer', () => ({
  __esModule: true,
  StoryMapLayer: ({ config }: { config: { id: string } }) => (
    <div data-testid={`mock-layer-${config.id}`} />
  ),
}));

// Z-order contract is asserted on the enforceMapLayerOrder call args.
jest.mock('terraso-web-client/storyMap/mapUtils', () => ({
  __esModule: true,
  enforceMapLayerOrder: jest.fn(),
}));

jest.mock('terraso-web-client/gis/components/GeoJsonSource', () => ({
  __esModule: true,
  default: ({ id }: { id: string }) => (
    <div data-testid="mock-geojson-source" data-id={id} />
  ),
}));

// Map chrome is out of scope here (and needs a real mapbox map).
jest.mock('terraso-web-client/gis/components/MapControls', () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock('terraso-web-client/gis/components/MapGeocoder', () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock('terraso-web-client/gis/components/MapStyleSwitcher', () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock(
  'terraso-web-client/sharedData/visualization/components/VisualizationMapLayer',
  () => {
    const actual = jest.requireActual(
      'terraso-web-client/sharedData/visualization/components/VisualizationMapLayer'
    );
    return {
      __esModule: true,
      ...actual,
      default: ({
        sourceName,
        visualizationConfig,
      }: {
        sourceName: string;
        visualizationConfig: any;
      }) => (
        <div
          data-testid={`mock-create-preview-${sourceName}`}
          data-config={JSON.stringify(
            visualizationConfig?.visualizeConfig ?? {}
          )}
        />
      ),
    };
  }
);

jest.mock(
  'terraso-web-client/storyMap/components/StoryMapForm/MapConfigurationDialog/FileUpload',
  () => {
    const { createTestDataEntryNode } = jest.requireActual(
      'terraso-web-client/tests/data/storyMap'
    );
    return {
      __esModule: true,
      FileUpload: ({
        externalFile,
        onCompleteSuccess,
      }: {
        externalFile?: File;
        onCompleteSuccess: (dataEntry: unknown) => void;
      }) => (
        <div data-testid="stub-file-upload">
          <span data-testid="stub-create-file">{externalFile?.name ?? ''}</span>
          <button
            onClick={() =>
              onCompleteSuccess(
                createTestDataEntryNode({
                  name: externalFile?.name ?? 'points.geojson',
                  resourceType:
                    externalFile?.name?.split('.').pop() ?? 'geojson',
                })
              )
            }
          >
            stub-upload-done
          </button>
        </div>
      ),
    };
  }
);

jest.mock(
  'terraso-web-client/sharedData/visualization/visualizationUtils',
  () => ({
    __esModule: true,
    identifyLatLngColumns: jest.fn(),
    validateCoordinateField: () => () => true,
    readMapFile: jest.fn(),
    readDataSetFile: jest.fn(),
    sheetToGeoJSON: () => ({ type: 'FeatureCollection', features: [] }),
  })
);

jest.mock(
  'terraso-web-client/sharedData/visualization/components/VisualizationConfigForm/VisualizeStep',
  () => {
    const actual = jest.requireActual(
      'terraso-web-client/sharedData/visualization/components/VisualizationConfigForm/VisualizeStep'
    );
    return {
      __esModule: true,
      ...actual,
      Shape: ({ setShape }: any) => (
        <button type="button" onClick={() => setShape('square')}>
          stub-shape
        </button>
      ),
      Size: ({ setSize }: any) => (
        <button type="button" onClick={() => setSize(20)}>
          stub-size
        </button>
      ),
      Color: ({ setColor }: any) => (
        <button type="button" onClick={() => setColor('#123456')}>
          stub-color
        </button>
      ),
      Opacity: ({ setOpacity }: any) => (
        <button type="button" onClick={() => setOpacity(80)}>
          stub-opacity
        </button>
      ),
    };
  }
);

jest.mock(
  'terraso-web-client/sharedData/visualization/components/VisualizationConfigForm/VisualizationPreview',
  () => ({ __esModule: true, default: () => null })
);

jest.mock(
  'terraso-web-client/sharedData/visualization/components/VisualizationConfigForm/ColumnSelect',
  () => ({
    __esModule: true,
    default: ({ field, id }: any) => (
      <input
        aria-label={id}
        value={field.value ?? ''}
        onChange={event => field.onChange(event.target.value)}
      />
    ),
  })
);

let mockDragEndHandler: ((result: unknown) => void) | undefined;
jest.mock('@hello-pangea/dnd', () => ({
  __esModule: true,
  DragDropContext: ({
    onDragEnd,
    children,
  }: {
    onDragEnd: (result: unknown) => void;
    children: any;
  }) => {
    mockDragEndHandler = onDragEnd;
    return <div data-testid="dnd-context">{children}</div>;
  },
  Droppable: ({ children }: { children: any }) =>
    children({ innerRef: () => {}, droppableProps: {}, placeholder: null }),
  Draggable: ({ children }: { children: any }) =>
    children(
      { innerRef: () => {}, draggableProps: {}, dragHandleProps: {} },
      { isDragging: false }
    ),
}));

type ConfigEdge = { node: { id: string } };
type MembershipListEdge = {
  node: {
    membershipList?: { memberships?: { edges: { node: { id: string } }[] } };
  };
};

interface DataLayersMock {
  storyMapConfigs?: ConfigEdge[];
  landscapeConfigs?: ConfigEdge[];
  groupConfigs?: ConfigEdge[];
  myGroups?: MembershipListEdge[];
  myLandscapes?: MembershipListEdge[];
}

let dataLayersMock: DataLayersMock = {};

const membershipEdge = (id: string): MembershipListEdge => ({
  node: {
    membershipList: {
      memberships: {
        edges: [{ node: { id } }],
      },
    },
  },
});

// GraphQL request handler for mocking network boundary
const mockGraphQLRequest = (query: string | any): Promise<any> => {
  const queryString = typeof query === 'string' ? query : query.toString();

  // Detect operation by content inspection
  if (queryString.includes('visualizationConfigs')) {
    return Promise.resolve({
      storyMapConfigs: {
        edges: dataLayersMock.storyMapConfigs ?? [
          {
            node: createTestVisualizationConfigNode({
              id: 'test-story-map-1',
              title: 'Story Map Layer 1',
            }),
          },
          {
            node: createTestVisualizationConfigNode({
              id: 'test-story-map-2',
              title: 'Story Map Layer 2',
            }),
          },
        ],
      },
      landscapeConfigs: { edges: dataLayersMock.landscapeConfigs ?? [] },
      groupConfigs: { edges: dataLayersMock.groupConfigs ?? [] },
      myGroups: { edges: dataLayersMock.myGroups ?? [] },
      myLandscapes: { edges: dataLayersMock.myLandscapes ?? [] },
    });
  }

  // Create layer mutation (the inline create flow's confirm)
  if (queryString.includes('addVisualizationConfig')) {
    return Promise.resolve({
      addVisualizationConfig: {
        visualizationConfig: {
          id: 'created-layer',
          title: 'Created Layer',
          description: '',
          configuration: JSON.stringify({
            visualizeConfig: {
              shape: 'circle',
              opacity: 50,
              size: 15,
              color: '#000000',
            },
          }),
          geojsonSignedUrl: 'https://example.com/created.geojson',
        },
        errors: [],
      },
    });
  }

  // Fallback for other queries
  return Promise.resolve({});
};

const ConfigProbe = () => {
  const { config } = useStoryMapConfigDataContext() as {
    config: StoryMapConfig;
  };
  return (
    <div data-testid="config-probe">
      {JSON.stringify({
        mapLayers: config.chapters?.[0]?.mapLayers,
        dataLayerConfigId: config.chapters?.[0]?.dataLayerConfigId,
        dataLayerIds: Object.keys(config.dataLayers ?? {}).sort(),
      })}
    </div>
  );
};

const probeData = () =>
  JSON.parse(screen.getByTestId('config-probe').textContent ?? '{}');

interface SetupOptions {
  open?: boolean;
  location?: any;
  title?: string;
  chapterId?: string;
  mapLayers?: MapLayerTransition[];
  dataLayerConfigId?: string;
  configDataLayers?: Record<string, MapLayerConfig>;
  dataLayers?: DataLayersMock;
}

interface SetupResult {
  renderResult: RenderResult;
  onCloseMock: jest.Mock;
  onConfirmMock: jest.Mock;
}

const setup = async (options: SetupOptions = {}): Promise<SetupResult> => {
  const {
    open = true,
    location = undefined,
    title = 'Test Chapter',
    chapterId = 'chapter-1',
    mapLayers = undefined,
    dataLayerConfigId = undefined,
    configDataLayers = {},
    dataLayers,
  } = options;

  if (dataLayers) {
    dataLayersMock = dataLayers;
  }

  const storyMapConfig = {
    ...createTestStoryMapConfig(),
    dataLayers: configDataLayers,
    chapters: [
      {
        id: 'chapter-1',
        title: 'Test Chapter',
        description: [],
        alignment: 'center',
        location: createTestStoryMapConfig().titleTransition?.location,
        mapLayers,
        dataLayerConfigId,
      },
    ],
  } as unknown as StoryMapConfig;
  const storyMap = createTestStoryMap();
  const onCloseMock = jest.fn();
  const onConfirmMock = jest.fn();

  const defaultInitialState = {
    account: {
      currentUser: {
        data: {
          email: 'test@example.com',
          firstName: 'Test',
          lastName: 'User',
        },
      },
    },
    storyMap: {
      dataLayers: {
        fetching: false,
        error: false,
        list: [],
        hasGroups: false,
        hasLandscapes: false,
      },
    },
  };

  const utils = await render(
    <StoryMapConfigContextProvider
      baseConfig={storyMapConfig}
      storyMap={storyMap}
    >
      <MapConfigurationDialog
        open={open}
        onClose={onCloseMock}
        onConfirm={onConfirmMock}
        location={location}
        title={title}
        chapterId={chapterId}
        mapLayers={mapLayers}
        dataLayerConfigId={dataLayerConfigId}
      />
      <ConfigProbe />
    </StoryMapConfigContextProvider>,
    defaultInitialState
  );

  await waitFor(() => {
    expect(
      screen.getByRole('list', {
        name: 'Map layers in this chapter, topmost first',
      })
    ).toBeTruthy();
  });
  // Either the tree or the load-error copy marks the tree region as settled.
  await waitFor(() => {
    expect(
      screen.queryAllByRole('tree').length +
        screen.queryAllByText(/couldn't load the map layers/i).length
    ).toBeGreaterThan(0);
  });

  return {
    renderResult: utils,
    onCloseMock,
    onConfirmMock,
  };
};

const orderListItems = () =>
  screen
    .queryAllByRole('listitem')
    .map(item => item.getAttribute('aria-label') ?? item.textContent);

const saveButton = () => screen.getByRole('button', { name: 'Save Map' });

describe('MapConfigurationDialog', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockDragEndHandler = undefined;
    dataLayersMock = {};
    mockMap = {
      on: jest.fn(),
      off: jest.fn(),
      getLayer: jest.fn(),
      moveLayer: jest.fn(),
      fitBounds: jest.fn(),
      getSource: jest.fn(),
      addSource: jest.fn(),
    };

    (terrasoApi.requestGraphQL as jest.Mock).mockImplementation(
      mockGraphQLRequest
    );
    (visualizationUtils.identifyLatLngColumns as jest.Mock).mockReturnValue({
      latColumn: 'lat',
      lngColumn: 'lng',
    });
    (visualizationUtils.readMapFile as jest.Mock).mockResolvedValue({
      geojson: { type: 'FeatureCollection', features: [] },
    });
    (visualizationUtils.readDataSetFile as jest.Mock).mockResolvedValue({
      headers: ['lat', 'lng'],
      headersIndexes: { lat: 0, lng: 1 },
      colCount: 2,
      rowCount: 2,
      sheet: {},
    });
  });

  describe('Test Suite 1: Rendering & Basic Interactions', () => {
    it('renders dialog with chapter title', async () => {
      await setup({ title: 'Chapter A' });

      expect(screen.getByRole('dialog', { hidden: true })).toBeInTheDocument();
      expect(
        screen.getByRole('heading', {
          level: 1,
          name: 'Edit map for Chapter A',
          hidden: true,
        })
      ).toBeInTheDocument();
    });

    it('renders dialog with fallback title when no title provided', async () => {
      await setup({ title: '' });

      expect(screen.getByRole('dialog', { hidden: true })).toBeInTheDocument();
      expect(
        screen.getByRole('heading', {
          level: 1,
          name: 'Edit map',
          hidden: true,
        })
      ).toBeInTheDocument();
    });

    it('closes dialog when cancel button is clicked', async () => {
      const { onCloseMock, onConfirmMock } = await setup();

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
      });

      expect(onCloseMock).toHaveBeenCalled();
      expect(onConfirmMock).not.toHaveBeenCalled();
    });

    it('renders the right column with the add control, order list and layer tree', async () => {
      await setup();

      // 1. compact add control
      expect(screen.getByText('Add a map layer')).toBeInTheDocument();
      expect(
        screen.getByText(
          'Drag and drop a map file here, or select one from your device.'
        )
      ).toBeInTheDocument();

      // 2. reorderable order list
      expect(
        screen.getByRole('list', {
          name: 'Map layers in this chapter, topmost first',
        })
      ).toBeInTheDocument();

      // 3. directory tree of the user's layers
      expect(screen.getByRole('tree')).toBeInTheDocument();
    });
  });

  describe('Test Suite 2: Chapter layer order list', () => {
    it('shows the chapter layers topmost first', async () => {
      await setup({
        mapLayers: [{ layerId: 'layer-b' }, { layerId: 'layer-a' }],
        dataLayerConfigId: 'layer-b',
        configDataLayers: {
          'layer-a': { id: 'layer-a', title: 'Alpha' } as MapLayerConfig,
          'layer-b': { id: 'layer-b', title: 'Beta' } as MapLayerConfig,
        },
      });

      expect(orderListItems()).toEqual(['Beta', 'Alpha']);
    });

    it('falls back to legacy dataLayerConfigId when mapLayers is absent', async () => {
      await setup({
        dataLayerConfigId: 'layer-a',
        configDataLayers: {
          'layer-a': { id: 'layer-a', title: 'Alpha' } as MapLayerConfig,
        },
      });

      expect(orderListItems()).toEqual(['Alpha']);
    });

    it('removes a layer from the chapter when its X icon is clicked', async () => {
      await setup({
        mapLayers: [{ layerId: 'layer-b' }, { layerId: 'layer-a' }],
        dataLayerConfigId: 'layer-b',
        configDataLayers: {
          'layer-a': { id: 'layer-a', title: 'Alpha' } as MapLayerConfig,
          'layer-b': { id: 'layer-b', title: 'Beta' } as MapLayerConfig,
        },
      });

      await act(async () => {
        fireEvent.click(
          screen.getByRole('button', {
            name: 'Remove Alpha from this chapter',
          })
        );
      });

      expect(orderListItems()).toEqual(['Beta']);
    });

    it('reorders layers by drag and drop without touching compat fields', async () => {
      const { onConfirmMock } = await setup({
        mapLayers: [{ layerId: 'layer-a' }, { layerId: 'layer-b' }],
        dataLayerConfigId: 'layer-a',
        configDataLayers: {
          'layer-a': { id: 'layer-a', title: 'Alpha' } as MapLayerConfig,
          'layer-b': { id: 'layer-b', title: 'Beta' } as MapLayerConfig,
        },
      });

      await waitFor(() => expect(mockDragEndHandler).toBeDefined());

      await act(async () => {
        mockDragEndHandler?.({
          source: { index: 0 },
          destination: { index: 1 },
        });
      });

      expect(orderListItems()).toEqual(['Beta', 'Alpha']);

      await act(async () => {
        fireEvent.click(saveButton());
      });

      const payload = onConfirmMock.mock.calls[0][0];
      expect(payload.mapLayerRows.map((row: any) => row.layerId)).toEqual([
        'layer-b',
        'layer-a',
      ]);
      // The dialog writes ONLY mapLayers + dataLayers — no compat knowledge.
      expect(payload.dataLayerConfigId).toBeUndefined();
      expect(payload.onChapterEnter).toBeUndefined();
    });

    it('a cancelled drag is a no-op', async () => {
      const { onConfirmMock } = await setup({
        mapLayers: [{ layerId: 'layer-a' }, { layerId: 'layer-b' }],
        dataLayerConfigId: 'layer-a',
        configDataLayers: {
          'layer-a': { id: 'layer-a', title: 'Alpha' } as MapLayerConfig,
          'layer-b': { id: 'layer-b', title: 'Beta' } as MapLayerConfig,
        },
      });

      await waitFor(() => expect(mockDragEndHandler).toBeDefined());

      await act(async () => {
        mockDragEndHandler?.({
          source: { index: 1 },
          destination: null,
        });
      });

      expect(orderListItems()).toEqual(['Alpha', 'Beta']);

      await act(async () => {
        fireEvent.click(saveButton());
      });

      const payload = onConfirmMock.mock.calls[0][0];
      expect(payload.mapLayerRows.map((row: any) => row.layerId)).toEqual([
        'layer-a',
        'layer-b',
      ]);
    });

    it('a same-index drop is a no-op', async () => {
      const { onConfirmMock } = await setup({
        mapLayers: [{ layerId: 'layer-a' }, { layerId: 'layer-b' }],
        dataLayerConfigId: 'layer-a',
        configDataLayers: {
          'layer-a': { id: 'layer-a', title: 'Alpha' } as MapLayerConfig,
          'layer-b': { id: 'layer-b', title: 'Beta' } as MapLayerConfig,
        },
      });

      await waitFor(() => expect(mockDragEndHandler).toBeDefined());

      await act(async () => {
        mockDragEndHandler?.({
          source: { index: 1 },
          destination: { index: 1 },
        });
      });

      expect(orderListItems()).toEqual(['Alpha', 'Beta']);

      await act(async () => {
        fireEvent.click(saveButton());
      });

      const payload = onConfirmMock.mock.calls[0][0];
      expect(payload.mapLayerRows.map((row: any) => row.layerId)).toEqual([
        'layer-a',
        'layer-b',
      ]);
    });

    it('drag reorder with a dangling ref present moves the intended entries', async () => {
      const { onConfirmMock } = await setup({
        mapLayers: [
          { layerId: 'ghost' },
          { layerId: 'layer-a' },
          { layerId: 'layer-b' },
        ],
        dataLayerConfigId: 'ghost',
        configDataLayers: {
          'layer-a': { id: 'layer-a', title: 'Alpha' } as MapLayerConfig,
          'layer-b': { id: 'layer-b', title: 'Beta' } as MapLayerConfig,
        },
      });

      expect(orderListItems()).toEqual(['Unknown layer', 'Alpha', 'Beta']);

      await waitFor(() => expect(mockDragEndHandler).toBeDefined());

      // Move Alpha (index 1) below Beta (index 2)
      await act(async () => {
        mockDragEndHandler?.({
          source: { index: 1 },
          destination: { index: 2 },
        });
      });

      expect(orderListItems()).toEqual(['Unknown layer', 'Beta', 'Alpha']);

      await act(async () => {
        fireEvent.click(saveButton());
      });

      const payload = onConfirmMock.mock.calls[0][0];
      expect(payload.mapLayerRows.map((row: any) => row.layerId)).toEqual([
        'ghost',
        'layer-b',
        'layer-a',
      ]);
    });

    it('a dangling ref survives confirm instead of being silently deleted', async () => {
      const { onConfirmMock } = await setup({
        mapLayers: [{ layerId: 'ghost' }, { layerId: 'layer-a' }],
        dataLayerConfigId: 'ghost',
        configDataLayers: {
          'layer-a': { id: 'layer-a', title: 'Alpha' } as MapLayerConfig,
        },
      });

      await act(async () => {
        fireEvent.click(saveButton());
      });

      const payload = onConfirmMock.mock.calls[0][0];
      expect(payload.mapLayerRows.map((row: any) => row.layerId)).toEqual([
        'ghost',
        'layer-a',
      ]);
      expect(payload.mapLayerRows[0].config).toBeNull();
    });
  });

  describe('Test Suite 3: Layer tree', () => {
    it('keeps landscape grouping and live title for layers in both lists (F1)', async () => {
      await setup({
        dataLayers: {
          landscapeConfigs: [
            {
              node: createTestVisualizationConfigNode({
                id: 'shared-layer',
                title: 'Live Title',
                owner: {
                  __typename: 'LandscapeNode',
                  id: 'landscape-1',
                  name: 'Alpha Landscape',
                } as any,
              }),
            },
          ],
          myLandscapes: [membershipEdge('m2')],
        },
        // Stored (persisted) shape: whitelisted schema fields only — no
        // ownerId/ownerName, and a stale title.
        configDataLayers: {
          'shared-layer': {
            id: 'shared-layer',
            title: 'Stale Title',
            ownerType: 'LandscapeNode',
          } as MapLayerConfig,
        },
      });

      // Fetched metadata wins: the layer stays under its named landscape and
      // shows its live title.
      const landscapeGroup = screen.getByRole('treeitem', {
        name: 'Alpha Landscape',
      });
      expect(
        within(landscapeGroup).getByRole('treeitem', { name: 'Live Title' })
      ).toBeInTheDocument();
      expect(screen.queryByText('Stale Title')).not.toBeInTheDocument();
      // No phantom owner group and not filed under "this story map".
      expect(
        within(
          screen.getByRole('treeitem', { name: 'This story map' })
        ).queryByRole('treeitem', { name: 'Live Title' })
      ).not.toBeInTheDocument();
    });

    it('shows a tree loading spinner while fetching, replaced when the layers resolve', async () => {
      let resolveFetch: (value: unknown) => void = () => {};
      (terrasoApi.requestGraphQL as jest.Mock).mockImplementation(
        () =>
          new Promise(resolve => {
            resolveFetch = resolve;
          })
      );

      const storyMapConfig = {
        ...createTestStoryMapConfig(),
        dataLayers: {},
        chapters: [
          {
            id: 'chapter-1',
            title: 'Test Chapter',
            description: [],
            alignment: 'center',
          },
        ],
      } as unknown as StoryMapConfig;
      await render(
        <StoryMapConfigContextProvider
          baseConfig={storyMapConfig}
          storyMap={createTestStoryMap()}
        >
          <MapConfigurationDialog
            open
            onClose={jest.fn()}
            onConfirm={jest.fn()}
            chapterId="chapter-1"
          />
        </StoryMapConfigContextProvider>,
        {
          account: {
            currentUser: {
              data: { email: 'test@example.com' },
            },
          },
          storyMap: {
            dataLayers: {
              fetching: true,
              error: false,
              list: [],
              hasGroups: false,
              hasLandscapes: false,
            },
          },
        }
      );

      await waitFor(() => {
        expect(screen.getByRole('progressbar')).toBeInTheDocument();
      });

      await act(async () => {
        resolveFetch({
          storyMapConfigs: {
            edges: [
              {
                node: createTestVisualizationConfigNode({
                  id: 'story-layer',
                  title: 'Story Layer',
                }),
              },
            ],
          },
          landscapeConfigs: { edges: [] },
          groupConfigs: { edges: [] },
          myGroups: { edges: [] },
          myLandscapes: { edges: [] },
        });
      });

      await waitFor(() => {
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
        expect(
          screen.getByRole('treeitem', { name: 'Story Layer' })
        ).toBeInTheDocument();
      });
    });

    it('builds the tree from fetched layers with the three sections', async () => {
      await setup({
        dataLayers: {
          storyMapConfigs: [
            {
              node: createTestVisualizationConfigNode({
                id: 'story-layer',
                title: 'Story Layer',
              }),
            },
          ],
          landscapeConfigs: [
            {
              node: createTestVisualizationConfigNode({
                id: 'landscape-layer',
                title: 'Landscape Layer',
                owner: {
                  __typename: 'LandscapeNode',
                  id: 'landscape-1',
                  name: 'Alpha Landscape',
                } as any,
              }),
            },
          ],
          groupConfigs: [
            {
              node: createTestVisualizationConfigNode({
                id: 'group-layer',
                title: 'Group Layer',
                owner: {
                  __typename: 'GroupNode',
                  id: 'group-1',
                  name: 'Alpha Group',
                } as any,
              }),
            },
          ],
          myGroups: [membershipEdge('m1')],
          myLandscapes: [membershipEdge('m2')],
        },
      });

      expect(
        screen.getByRole('treeitem', { name: 'This story map' })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('treeitem', { name: 'Landscapes' })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('treeitem', { name: 'Groups' })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('treeitem', { name: 'Story Layer' })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('treeitem', { name: 'Alpha Landscape' })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('treeitem', { name: 'Landscape Layer' })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('treeitem', { name: 'Alpha Group' })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('treeitem', { name: 'Group Layer' })
      ).toBeInTheDocument();
    });

    it('toggles a layer on from the tree: order list, eye and preview update', async () => {
      await setup();

      const row = screen.getByRole('treeitem', { name: 'Story Map Layer 1' });
      await act(async () => {
        fireEvent.click(row);
      });

      expect(orderListItems()).toEqual(['Story Map Layer 1']);
      expect(
        screen.getByRole('button', {
          name: 'Show or hide Story Map Layer 1',
        })
      ).toHaveAttribute('aria-pressed', 'true');
      expect(
        screen.getByTestId('mock-layer-test-story-map-1')
      ).toBeInTheDocument();

      // toggling the eye toggles the layer off again
      await act(async () => {
        fireEvent.click(
          screen.getByRole('button', {
            name: 'Show or hide Story Map Layer 1',
          })
        );
      });
      expect(orderListItems()).toEqual([]);
      expect(
        screen.queryByTestId('mock-layer-test-story-map-1')
      ).not.toBeInTheDocument();
    });

    it('shows layers already in the chapter as on', async () => {
      await setup({
        mapLayers: [{ layerId: 'test-story-map-1' }],
        dataLayerConfigId: 'test-story-map-1',
      });

      expect(
        screen.getByRole('treeitem', { name: 'Story Map Layer 1' })
      ).toHaveAttribute('aria-selected', 'true');
      expect(
        screen.getByRole('treeitem', { name: 'Story Map Layer 2' })
      ).toHaveAttribute('aria-selected', 'false');
    });

    it('shows the empty state copy when the story map has no layers', async () => {
      await setup({
        dataLayers: {
          storyMapConfigs: [],
          myGroups: [membershipEdge('m1')],
        },
      });

      expect(
        screen.getByText(
          "This story map doesn't contain any map layers yet. Upload a new file above or select a layer from your groups or landscapes."
        )
      ).toBeInTheDocument();
    });

    it('shows the groups empty state when the user is a member of groups without layers', async () => {
      await setup({
        dataLayers: {
          myGroups: [membershipEdge('m1')],
        },
      });

      expect(
        screen.getByText('No maps have been made in your groups yet.')
      ).toBeInTheDocument();
    });

    it('hides the landscapes and groups sections when the user is not a member', async () => {
      await setup();

      expect(
        screen.queryByRole('treeitem', { name: 'Landscapes' })
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole('treeitem', { name: 'Groups' })
      ).not.toBeInTheDocument();
    });

    it('shows the load error message when fetching data layers fails', async () => {
      (terrasoApi.requestGraphQL as jest.Mock).mockImplementation(
        (query: string | any) => {
          const queryString =
            typeof query === 'string' ? query : query.toString();
          if (queryString.includes('visualizationConfigs')) {
            return Promise.reject(new Error('network error'));
          }
          return mockGraphQLRequest(query);
        }
      );

      await setup();

      await waitFor(() => {
        expect(
          screen.getByText(
            "We couldn't load the map layers. Please try again later."
          )
        ).toBeInTheDocument();
      });
    });
  });

  describe('Test Suite 4: Inline create flow', () => {
    const createTestFile = (
      name = 'points.geojson',
      type = 'application/geo+json'
    ) => new File(['x'], name, { type });

    // Starts a create session through the window-wide drop target and drives
    // the stubbed upload to the ready (form visible) state.
    const startCreation = async (file = createTestFile()) => {
      await act(async () => {
        fireEvent.drop(window as unknown as HTMLElement, {
          dataTransfer: { files: [file] },
        });
      });
      await waitFor(() => {
        expect(
          screen.getByRole('heading', {
            name: 'Create a map layer for Test Chapter',
          })
        ).toBeInTheDocument();
      });
      await act(async () => {
        fireEvent.click(
          screen.getByRole('button', { name: 'stub-upload-done' })
        );
      });
      await waitFor(() => {
        expect(screen.getByLabelText(/^Layer Title/)).toBeInTheDocument();
      });
    };

    it('shows the create steps in the sidebar for a file dropped on the window', async () => {
      await setup();

      const file = createTestFile();
      await act(async () => {
        fireEvent.drop(window as unknown as HTMLElement, {
          dataTransfer: { files: [file] },
        });
      });

      // The layers panel is replaced by the create steps in the sidebar.
      expect(
        screen.getByRole('heading', {
          name: 'Create a map layer for Test Chapter',
        })
      ).toBeInTheDocument();
      expect(screen.getByTestId('stub-create-file')).toHaveTextContent(
        'points.geojson'
      );
      expect(
        screen.queryByRole('list', {
          name: 'Map layers in this chapter, topmost first',
        })
      ).not.toBeInTheDocument();
    });

    it('shows the create steps for a file dropped on the compact add control', async () => {
      await setup();

      const file = createTestFile();
      const dropTarget = screen.getByRole('button', {
        name: 'Add a map layer',
      });

      await act(async () => {
        fireEvent.drop(dropTarget, {
          dataTransfer: { files: [file] },
        });
      });

      await waitFor(() => {
        expect(screen.getByTestId('stub-create-file')).toHaveTextContent(
          'points.geojson'
        );
      });
    });

    it('shows the create steps for a file picked through the file input', async () => {
      await setup();

      const file = createTestFile();
      const fileInput = document.querySelector(
        'input[type="file"]'
      ) as HTMLInputElement;
      await act(async () => {
        fireEvent.change(fileInput, { target: { files: [file] } });
      });

      await waitFor(() => {
        expect(
          screen.getByRole('heading', {
            name: 'Create a map layer for Test Chapter',
          })
        ).toBeInTheDocument();
      });
      expect(screen.getByTestId('stub-create-file')).toHaveTextContent(
        'points.geojson'
      );
    });

    it('renders the preview topmost on the shared map and live-updates it', async () => {
      await setup({
        mapLayers: [{ layerId: 'test-story-map-1' }],
        dataLayerConfigId: 'test-story-map-1',
        configDataLayers: {
          'test-story-map-1': {
            id: 'test-story-map-1',
            title: 'Story Map Layer 1',
          } as MapLayerConfig,
        },
      });

      await startCreation();

      // The create preview renders on the shared map ABOVE the chapter's
      // layers (rendered after them, mapbox adds later layers on top).
      const mapLayersRendered = within(screen.getByTestId('mock-map'))
        .queryAllByTestId(/^(mock-layer|mock-create-preview)/)
        .map(element => element.getAttribute('data-testid'));
      expect(mapLayersRendered).toEqual([
        'mock-layer-test-story-map-1',
        `mock-create-preview-${MAP_LAYER_CREATE_PREVIEW_ID}`,
      ]);

      // …and the z-order enforcement stacks it on top of the chapter layers.
      expect(enforceMapLayerOrder).toHaveBeenLastCalledWith(mockMap, [
        { layerId: MAP_LAYER_CREATE_PREVIEW_ID },
        { layerId: 'test-story-map-1' },
      ]);

      // Configuration changes live-update the preview.
      const preview = screen.getByTestId(
        `mock-create-preview-${MAP_LAYER_CREATE_PREVIEW_ID}`
      );
      expect(preview.getAttribute('data-config')).toContain(
        theme.palette.visualization.markerDefaultColor
      );
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'stub-color' }));
      });
      expect(preview.getAttribute('data-config')).toContain('#123456');
    });

    it('cancel during creation keeps the dialog open, the draft intact and commits nothing', async () => {
      const { onCloseMock, onConfirmMock } = await setup({
        mapLayers: [{ layerId: 'test-story-map-1' }],
        dataLayerConfigId: 'test-story-map-1',
        configDataLayers: {
          'test-story-map-1': {
            id: 'test-story-map-1',
            title: 'Story Map Layer 1',
          } as MapLayerConfig,
        },
      });

      await startCreation();

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Back to layers' }));
      });

      // Creation is cancelled; the map dialog stays open and unchanged.
      expect(onCloseMock).not.toHaveBeenCalled();
      expect(onConfirmMock).not.toHaveBeenCalled();
      await waitFor(() => {
        expect(
          screen.getByRole('list', {
            name: 'Map layers in this chapter, topmost first',
          })
        ).toBeInTheDocument();
      });
      expect(orderListItems()).toEqual(['Story Map Layer 1']);
      expect(probeData()).toEqual({
        mapLayers: [{ layerId: 'test-story-map-1' }],
        dataLayerConfigId: 'test-story-map-1',
        dataLayerIds: ['test-story-map-1'],
      });
      expect(terrasoApi.requestGraphQL).not.toHaveBeenCalledWith(
        expect.stringContaining('addVisualizationConfig'),
        expect.anything()
      );
    });

    it('commits a created layer immediately and survives dialog cancel', async () => {
      const { onCloseMock, onConfirmMock } = await setup({
        mapLayers: [{ layerId: 'test-story-map-1' }],
        dataLayerConfigId: 'test-story-map-1',
        configDataLayers: {
          'test-story-map-1': {
            id: 'test-story-map-1',
            title: 'Story Map Layer 1',
          } as MapLayerConfig,
        },
      });

      await startCreation();

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Add map layer' }));
      });

      // committed to config immediately…
      expect(probeData()).toEqual({
        mapLayers: [
          { layerId: 'created-layer' },
          { layerId: 'test-story-map-1' },
        ],
        dataLayerConfigId: 'created-layer',
        dataLayerIds: ['created-layer', 'test-story-map-1'],
      });
      // …back to the layers panel, with the new layer at the top of the
      // order list…
      await waitFor(() => {
        expect(
          screen.getByRole('list', {
            name: 'Map layers in this chapter, topmost first',
          })
        ).toBeInTheDocument();
      });
      expect(orderListItems()[0]).toBe('Created Layer');
      // …and "on" in the tree.
      expect(
        screen.getByRole('treeitem', { name: 'Created Layer' })
      ).toHaveAttribute('aria-selected', 'true');
      expect(
        screen.getByTestId('mock-layer-created-layer')
      ).toBeInTheDocument();

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
      });
      expect(onCloseMock).toHaveBeenCalled();
      expect(onConfirmMock).not.toHaveBeenCalled();

      // the create-flow commit survives the dialog cancel
      expect(probeData()).toEqual({
        mapLayers: [
          { layerId: 'created-layer' },
          { layerId: 'test-story-map-1' },
        ],
        dataLayerConfigId: 'created-layer',
        dataLayerIds: ['created-layer', 'test-story-map-1'],
      });
    });

    it('ignores files that the create flow does not accept', async () => {
      await setup();

      const file = new File(['x'], 'notes.txt', { type: 'text/plain' });
      await act(async () => {
        fireEvent.drop(window as unknown as HTMLElement, {
          dataTransfer: { files: [file] },
        });
      });

      // No creation starts for a rejected file.
      expect(
        screen.queryByRole('heading', {
          name: 'Create a map layer for Test Chapter',
        })
      ).not.toBeInTheDocument();
    });

    it('shows a rejection message when a dropped file is not accepted', async () => {
      await setup();

      const file = new File(['x'], 'notes.txt', { type: 'text/plain' });
      await act(async () => {
        fireEvent.drop(window as unknown as HTMLElement, {
          dataTransfer: { files: [file] },
        });
      });

      expect(
        screen.getByText(
          'notes.txt cannot be added because the file type(s) are not supported.'
        )
      ).toBeInTheDocument();
    });

    it('shows a rejection message for oversized files', async () => {
      await setup();

      const file = new File(['x'], 'big.geojson', {
        type: 'application/geo+json',
      });
      Object.defineProperty(file, 'size', { value: 50000001 });
      await act(async () => {
        fireEvent.drop(window as unknown as HTMLElement, {
          dataTransfer: { files: [file] },
        });
      });

      expect(
        screen.getByText(
          'big.geojson cannot be added because one or more files are too large.'
        )
      ).toBeInTheDocument();
    });

    it('shows a drag-over affordance while dragging a file over the window', async () => {
      await setup();

      expect(
        screen.queryByTestId('window-drop-overlay')
      ).not.toBeInTheDocument();

      await act(async () => {
        fireEvent.dragOver(window as unknown as HTMLElement, {
          dataTransfer: { types: ['Files'] },
        });
      });

      expect(screen.getByTestId('window-drop-overlay')).toBeInTheDocument();

      await act(async () => {
        fireEvent.drop(window as unknown as HTMLElement, {
          dataTransfer: { files: [] },
        });
      });

      expect(
        screen.queryByTestId('window-drop-overlay')
      ).not.toBeInTheDocument();
    });

    it('ignores drops while layer creation is in progress', async () => {
      await setup();

      const first = new File(['x'], 'points.geojson', {
        type: 'application/geo+json',
      });
      await act(async () => {
        fireEvent.drop(window as unknown as HTMLElement, {
          dataTransfer: { files: [first] },
        });
      });
      await waitFor(() => {
        expect(screen.getByTestId('stub-create-file')).toHaveTextContent(
          'points.geojson'
        );
      });

      const second = new File(['x'], 'other.geojson', {
        type: 'application/geo+json',
      });
      await act(async () => {
        fireEvent.drop(window as unknown as HTMLElement, {
          dataTransfer: { files: [second] },
        });
      });

      // No file swap mid-form.
      expect(screen.getByTestId('stub-create-file')).toHaveTextContent(
        'points.geojson'
      );
      expect(screen.getByTestId('stub-create-file')).not.toHaveTextContent(
        'other.geojson'
      );

      // Drops work again once the creation is cancelled.
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Back to layers' }));
      });
      await act(async () => {
        fireEvent.drop(window as unknown as HTMLElement, {
          dataTransfer: { files: [second] },
        });
      });
      await waitFor(() => {
        expect(screen.getByTestId('stub-create-file')).toHaveTextContent(
          'other.geojson'
        );
      });
    });

    it('takes the first file of a multi-file drop and ignores the rest', async () => {
      await setup();

      const first = new File(['x'], 'points.geojson', {
        type: 'application/geo+json',
      });
      const second = new File(['x'], 'other.geojson', {
        type: 'application/geo+json',
      });
      await act(async () => {
        fireEvent.drop(window as unknown as HTMLElement, {
          dataTransfer: { files: [first, second] },
        });
      });

      await waitFor(() => {
        expect(screen.getByTestId('stub-create-file')).toHaveTextContent(
          'points.geojson'
        );
      });
      expect(screen.getByTestId('stub-create-file')).not.toHaveTextContent(
        'other.geojson'
      );
    });

    it('activates the add control with the keyboard', async () => {
      await setup();

      const clickSpy = jest
        .spyOn(HTMLInputElement.prototype, 'click')
        .mockImplementation(() => {});

      const addControl = screen.getByRole('button', {
        name: 'Add a map layer',
      });
      await act(async () => {
        fireEvent.keyDown(addControl, { key: 'Enter' });
      });
      expect(clickSpy).toHaveBeenCalled();

      clickSpy.mockClear();
      await act(async () => {
        fireEvent.keyDown(addControl, { key: ' ' });
      });
      expect(clickSpy).toHaveBeenCalled();

      clickSpy.mockRestore();
    });
  });

  describe('Test Suite 5: Confirm payload', () => {
    it('sends the ordered layer rows with resolved configs (no compat fields)', async () => {
      const { onConfirmMock } = await setup();

      await act(async () => {
        fireEvent.click(
          screen.getByRole('treeitem', { name: 'Story Map Layer 1' })
        );
      });
      await act(async () => {
        fireEvent.click(
          screen.getByRole('treeitem', { name: 'Story Map Layer 2' })
        );
      });

      expect(orderListItems()).toEqual([
        'Story Map Layer 2',
        'Story Map Layer 1',
      ]);

      await act(async () => {
        fireEvent.click(saveButton());
      });

      const payload = onConfirmMock.mock.calls[0][0];
      expect(payload.mapLayerRows.map((row: any) => row.layerId)).toEqual([
        'test-story-map-2',
        'test-story-map-1',
      ]);
      expect(payload.mapLayerRows.map((row: any) => row.config?.id)).toEqual([
        'test-story-map-2',
        'test-story-map-1',
      ]);
      // The dialog writes ONLY mapLayers + dataLayers — no compat knowledge.
      expect(payload.dataLayerConfigId).toBeUndefined();
      expect(payload.onChapterEnter).toBeUndefined();
      expect(payload.mapStyle).toEqual(createTestStoryMapConfig().style);
    });

    it('sends the map location', async () => {
      const { onConfirmMock } = await setup({
        location: createTestPosition(),
      });

      await act(async () => {
        fireEvent.click(saveButton());
      });

      const payload = onConfirmMock.mock.calls[0][0];
      expect(payload.location).toEqual({
        center: expect.anything(),
        zoom: expect.anything(),
        pitch: expect.anything(),
        bearing: expect.anything(),
        bounds: expect.anything(),
      });
    });
  });
});
