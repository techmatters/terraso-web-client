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

import { MapConfigurationDialog } from 'terraso-web-client/storyMap/components/StoryMapForm/MapConfigurationDialog/MapConfigurationDialog';
import { SIDEBAR_WIDTH } from 'terraso-web-client/storyMap/components/StoryMapForm/MapConfigurationDialog/MapLayersPanel';
import {
  StoryMapConfigContextProvider,
  useStoryMapConfigDataContext,
} from 'terraso-web-client/storyMap/components/StoryMapForm/storyMapConfigContext';
import {
  MapLayerConfig,
  MapLayerTransition,
  StoryMapConfig,
} from 'terraso-web-client/storyMap/storyMapTypes';

// Mock terrasoApi at the network boundary
jest.mock('terraso-client-shared/terrasoApi/api');

const mockChangeStyle = jest.fn();

// Set up mocks BEFORE importing components
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
    useMap: () => ({ map: null, changeStyle: mockChangeStyle }),
  };
});

// Mirrors the real MapStyleSwitcher contract: a basemap change is applied to
// the shared map live (changeStyle) AND reported to the host (onStyleChange).
jest.mock('terraso-web-client/gis/components/MapStyleSwitcher', () => ({
  __esModule: true,
  default: ({ onStyleChange }: { onStyleChange?: (_: unknown) => void }) => (
    <button
      onClick={() => {
        mockChangeStyle('draftStyle');
        onStyleChange?.({ newStyle: { data: 'draftStyle' } });
      }}
    >
      Change Style
    </button>
  ),
}));

jest.mock('terraso-web-client/storyMap/components/StoryMapLayer', () => ({
  __esModule: true,
  StoryMapLayer: ({ config }: { config: { id: string } }) => (
    <div data-testid={`mock-layer-${config.id}`} />
  ),
}));

jest.mock(
  'terraso-web-client/storyMap/components/StoryMapForm/MapConfigurationDialog/CreateMapLayerDialog',
  () => {
    const { useState } = jest.requireActual('react');
    return {
      __esModule: true,
      CreateMapLayerFileUpload: ({
        onCreate,
        externalFile,
        onCreateDialogOpenChange,
      }: {
        onCreate: (mapLayer: unknown) => void;
        externalFile?: File;
        onCreateDialogOpenChange?: (open: boolean) => void;
      }) => {
        // Mirrors the real create dialog: a stacked MUI modal of its own.
        const [createOpen, setCreateOpen] = useState(false);
        return (
          <div data-testid="stub-create-flow">
            <span data-testid="stub-create-file">
              {externalFile?.name ?? ''}
            </span>
            {createOpen && (
              <div className="MuiModal-root" data-testid="stub-create-modal" />
            )}
            <button
              onClick={() => {
                setCreateOpen(true);
                onCreateDialogOpenChange?.(true);
              }}
            >
              stub-open-create
            </button>
            <button
              onClick={() => {
                setCreateOpen(false);
                onCreateDialogOpenChange?.(false);
              }}
            >
              stub-close-create
            </button>
            <button
              onClick={() =>
                onCreate({
                  id: 'created-layer',
                  title: 'Created Layer',
                  ownerType: 'StoryMapNode',
                  geojsonSignedUrl: 'https://example.com/created.geojson',
                })
              }
            >
              stub-create-layer
            </button>
          </div>
        );
      },
    };
  }
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

    (terrasoApi.requestGraphQL as jest.Mock).mockImplementation(
      mockGraphQLRequest
    );
  });

  describe('Test Suite 1: Rendering & Basic Interactions', () => {
    it('renders the fullscreen overlay with the chapter title in the top bar', async () => {
      await setup({ title: 'Chapter A' });

      expect(screen.getByTestId('map-config-overlay')).toBeInTheDocument();
      expect(screen.getByRole('dialog', { hidden: true })).toBeInTheDocument();
      expect(
        screen.getByRole('heading', {
          level: 1,
          name: 'Edit map for Chapter A',
          hidden: true,
        })
      ).toBeInTheDocument();

      // the title lives in the overlay's top bar (editor TopBar shape)
      const topBar = screen.getByTestId('map-config-top-bar');
      expect(
        within(topBar).getByRole('heading', {
          level: 1,
          name: 'Edit map for Chapter A',
        })
      ).toBeInTheDocument();
      expect(
        within(topBar).getByRole('button', { name: 'Close' })
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

    it('renders the right sidebar with the add control, order list and layer tree', async () => {
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

      // 4. the sidebar keeps the story map configuration right sidebar width
      expect(SIDEBAR_WIDTH).toBe(300);
      expect(screen.getByTestId('map-config-layers-panel')).toHaveStyle({
        width: '300px',
        // 300px total (padding included) — same dimensions as RightSidebar.
        boxSizing: 'border-box',
      });
    });

    it('renders the left sidebar invitation to drag the map', async () => {
      await setup();

      const positionPanel = screen.getByTestId('map-config-position-panel');
      // The invitation covers exactly the chapters list area (200px total).
      expect(positionPanel).toHaveStyle({
        width: '200px',
        boxSizing: 'border-box',
      });
      expect(
        within(positionPanel).getByText('Drag the map to change its position')
      ).toBeInTheDocument();
      // The set-map helper content stays reachable from the invitation panel.
      expect(
        within(positionPanel).getByRole('button', {
          name: 'Set the location, basemap style, and add layers',
        })
      ).toBeInTheDocument();
    });

    it('renders a large bottom bar with Save and Cancel', async () => {
      await setup();

      const bottomBar = screen.getByTestId('map-config-bottom-bar');
      expect(
        within(bottomBar).getByRole('button', { name: 'Save Map' })
      ).toBeInTheDocument();
      expect(
        within(bottomBar).getByRole('button', { name: /cancel/i })
      ).toBeInTheDocument();
    });

    it('leaves the map area between the bars transparent and click-through', async () => {
      await setup();

      const mapWindow = screen.getByTestId('map-config-map-window');
      expect(mapWindow).toHaveStyle({ pointerEvents: 'none' });
      // No background paint over the live editor map.
      expect(['transparent', 'rgba(0, 0, 0, 0)', '']).toContain(
        getComputedStyle(mapWindow).backgroundColor
      );

      // The overlay itself lets pointer events through to the map…
      expect(screen.getByTestId('map-config-overlay')).toHaveStyle({
        pointerEvents: 'none',
      });
      // …while the bars/sidebars stay interactive.
      expect(screen.getByTestId('map-config-top-bar')).toHaveStyle({
        pointerEvents: 'auto',
      });
      expect(screen.getByTestId('map-config-bottom-bar')).toHaveStyle({
        pointerEvents: 'auto',
      });
    });

    it('closes the overlay with the close (X) button without confirming', async () => {
      const { onCloseMock, onConfirmMock } = await setup();

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Close' }));
      });

      expect(onCloseMock).toHaveBeenCalled();
      expect(onConfirmMock).not.toHaveBeenCalled();
    });

    it('closes the overlay with Escape without confirming', async () => {
      const { onCloseMock, onConfirmMock } = await setup();

      await act(async () => {
        fireEvent.keyDown(window, { key: 'Escape' });
      });

      expect(onCloseMock).toHaveBeenCalled();
      expect(onConfirmMock).not.toHaveBeenCalled();
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

  describe('Test Suite 4: Create flow', () => {
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

      await act(async () => {
        fireEvent.click(
          screen.getByRole('button', {
            name: 'stub-create-layer',
            hidden: true,
          })
        );
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
      // …and visible in the draft order list (topmost)
      expect(orderListItems()[0]).toBe('Created Layer');

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

    it('starts the create flow with a file dropped anywhere on the window', async () => {
      await setup();

      const file = new File(['x'], 'points.geojson', {
        type: 'application/geo+json',
      });
      await act(async () => {
        fireEvent.drop(window as unknown as HTMLElement, {
          dataTransfer: { files: [file] },
        });
      });

      await waitFor(() => {
        expect(screen.getByTestId('stub-create-file')).toHaveTextContent(
          'points.geojson'
        );
      });
    });

    it('starts the create flow with a file dropped on the compact add control', async () => {
      await setup();

      const file = new File(['x'], 'points.geojson', {
        type: 'application/geo+json',
      });
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

    it('ignores files that the create flow does not accept', async () => {
      await setup();

      const file = new File(['x'], 'notes.txt', { type: 'text/plain' });
      await act(async () => {
        fireEvent.drop(window as unknown as HTMLElement, {
          dataTransfer: { files: [file] },
        });
      });

      expect(screen.getByTestId('stub-create-file')).toHaveTextContent('');
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

    it('ignores drops while the create layer dialog is open', async () => {
      await setup();

      await act(async () => {
        fireEvent.click(
          screen.getByRole('button', { name: 'stub-open-create', hidden: true })
        );
      });

      const file = new File(['x'], 'points.geojson', {
        type: 'application/geo+json',
      });
      await act(async () => {
        fireEvent.drop(window as unknown as HTMLElement, {
          dataTransfer: { files: [file] },
        });
      });

      // No file swap mid-form.
      expect(screen.getByTestId('stub-create-file')).toHaveTextContent('');

      // Drops work again once the create dialog is closed.
      await act(async () => {
        fireEvent.click(
          screen.getByRole('button', {
            name: 'stub-close-create',
            hidden: true,
          })
        );
      });
      await act(async () => {
        fireEvent.drop(window as unknown as HTMLElement, {
          dataTransfer: { files: [file] },
        });
      });
      await waitFor(() => {
        expect(screen.getByTestId('stub-create-file')).toHaveTextContent(
          'points.geojson'
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

    it('sends the changed basemap style on confirm', async () => {
      const { onConfirmMock } = await setup();

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Change Style' }));
      });
      await act(async () => {
        fireEvent.click(saveButton());
      });

      const payload = onConfirmMock.mock.calls[0][0];
      expect(payload.mapStyle).toEqual('draftStyle');
    });
  });

  describe('Test Suite 6: Draft discard on the shared editor map', () => {
    const CONFIG_STYLE = createTestStoryMapConfig().style;

    const changeBasemap = async () => {
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Change Style' }));
      });
      // The style switcher has already styled the shared map live.
      expect(mockChangeStyle).toHaveBeenCalledWith('draftStyle');
    };

    it('restores the config basemap style when the overlay is cancelled after a style change', async () => {
      const { onCloseMock, onConfirmMock } = await setup();
      await changeBasemap();

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
      });

      expect(onCloseMock).toHaveBeenCalled();
      expect(onConfirmMock).not.toHaveBeenCalled();
      // Cancel discards the basemap draft: the shared map is restored.
      expect(mockChangeStyle).toHaveBeenLastCalledWith(CONFIG_STYLE);
    });

    it('restores the config basemap style when the overlay is closed with X after a style change', async () => {
      const { onCloseMock, onConfirmMock } = await setup();
      await changeBasemap();

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Close' }));
      });

      expect(onCloseMock).toHaveBeenCalled();
      expect(onConfirmMock).not.toHaveBeenCalled();
      expect(mockChangeStyle).toHaveBeenLastCalledWith(CONFIG_STYLE);
    });

    it('restores the config basemap style on Escape after a style change', async () => {
      const { onCloseMock, onConfirmMock } = await setup();
      await changeBasemap();

      await act(async () => {
        fireEvent.keyDown(window, { key: 'Escape' });
      });

      expect(onCloseMock).toHaveBeenCalled();
      expect(onConfirmMock).not.toHaveBeenCalled();
      expect(mockChangeStyle).toHaveBeenLastCalledWith(CONFIG_STYLE);
    });

    it('does not restore the basemap style when the change is confirmed', async () => {
      const { onConfirmMock } = await setup();
      await changeBasemap();

      await act(async () => {
        fireEvent.click(saveButton());
      });

      expect(onConfirmMock).toHaveBeenCalledWith(
        expect.objectContaining({ mapStyle: 'draftStyle' })
      );
      // No restore: the confirmed style is now the config style.
      expect(mockChangeStyle).toHaveBeenCalledTimes(1);
    });

    it('discards the draft layer edits when the dialog closes and reopens', async () => {
      const layerSetup = {
        mapLayers: [{ layerId: 'layer-b' }, { layerId: 'layer-a' }],
        dataLayerConfigId: 'layer-b',
        configDataLayers: {
          'layer-a': { id: 'layer-a', title: 'Alpha' } as MapLayerConfig,
          'layer-b': { id: 'layer-b', title: 'Beta' } as MapLayerConfig,
        },
      };
      const { renderResult, onCloseMock } = await setup(layerSetup);

      await act(async () => {
        fireEvent.click(
          screen.getByRole('button', {
            name: 'Remove Alpha from this chapter',
          })
        );
      });
      expect(orderListItems()).toEqual(['Beta']);

      // Close (Cancel): the host unmounts the overlay…
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
      });
      expect(onCloseMock).toHaveBeenCalled();
      renderResult.unmount();

      // …and a reopen shows the chapter's saved layers again: the removal
      // was draft-only (created layers commit immediately; draft edits do not).
      await setup(layerSetup);
      expect(orderListItems()).toEqual(['Beta', 'Alpha']);
    });
  });

  describe('Test Suite 7: Escape and stacked sub-dialogs', () => {
    it('lets the create layer dialog handle Escape before the overlay', async () => {
      const { onCloseMock } = await setup();

      await act(async () => {
        fireEvent.click(
          screen.getByRole('button', { name: 'stub-open-create' })
        );
      });

      // First Escape belongs to the stacked create dialog (branch-1 parity).
      await act(async () => {
        fireEvent.keyDown(window, { key: 'Escape' });
      });
      expect(onCloseMock).not.toHaveBeenCalled();

      // The create dialog closed itself on that Escape (as MUI dialogs do).
      await act(async () => {
        fireEvent.click(
          screen.getByRole('button', { name: 'stub-close-create' })
        );
      });

      // With no sub-dialog open, Escape cancels the overlay.
      await act(async () => {
        fireEvent.keyDown(window, { key: 'Escape' });
      });
      expect(onCloseMock).toHaveBeenCalled();
    });

    it('lets the set-map helper dialog handle Escape before the overlay', async () => {
      const { onCloseMock } = await setup();

      await act(async () => {
        fireEvent.click(
          screen.getByRole('button', {
            name: 'Set the location, basemap style, and add layers',
          })
        );
      });
      expect(screen.getByText(/Step 1\. Find a location/)).toBeInTheDocument();

      // Escape while the helper is stacked must not cancel the overlay (the
      // helper gets the key first and closes itself — branch-1 parity).
      const helperDialog = document.querySelector('.MuiPopover-root');
      expect(helperDialog).not.toBeNull();
      await act(async () => {
        fireEvent.keyDown(helperDialog!, { key: 'Escape' });
      });
      expect(onCloseMock).not.toHaveBeenCalled();

      // With the helper gone (its exit transition finished), Escape cancels
      // the overlay.
      const helperClose = helperDialog!.querySelector(
        'button[title="Close"]'
      ) as HTMLButtonElement;
      expect(helperClose).not.toBeNull();
      await act(async () => {
        fireEvent.click(helperClose);
      });
      await waitFor(() => {
        expect(document.querySelector('.MuiModal-root')).toBeNull();
      });
      await act(async () => {
        fireEvent.keyDown(window, { key: 'Escape' });
      });
      expect(onCloseMock).toHaveBeenCalled();
    });
  });
});
