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
import { cloneElement, useState } from 'react';
import * as terrasoApi from 'terraso-client-shared/terrasoApi/api';
import {
  createTestPosition,
  createTestStoryMap,
  createTestStoryMapConfig,
  createTestVisualizationConfigNode,
} from 'terraso-web-client/tests/data/storyMap';
import { createLoadedMapMock } from 'terraso-web-client/tests/mapboxMock';

import mapboxgl from 'terraso-web-client/gis/mapbox';
import {
  MapConfigLayerStack,
  MapConfigLayerStackProvider,
} from 'terraso-web-client/storyMap/components/mapConfigLayerStack';
import { MapConfigurationDialog } from 'terraso-web-client/storyMap/components/StoryMapForm/MapConfigurationDialog/MapConfigurationDialog';
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
// The overlay is hosted over the SHARED editor map: the suite drives it
// through a real map instance mock (camera path included).
let mockMap: ReturnType<typeof createLoadedMapMock>;

jest.mock('terraso-web-client/gis/mapbox', () => ({}));

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
    useMap: () => ({ map: mockMap, changeStyle: mockChangeStyle }),
  };
});

// Mirrors the real MapStyleSwitcher contract: a basemap change is applied to
// the shared map live (changeStyle) AND reported to the host (onStyleChange).
// The style MENU is a stacked sub-dialog of its own: it reports onOpenChange
// and closes itself on Escape (like MUI).
jest.mock('terraso-web-client/gis/components/MapStyleSwitcher', () => {
  const { useState, useEffect } = jest.requireActual('react');
  return {
    __esModule: true,
    default: function MapStyleSwitcherStub({
      onStyleChange,
      onOpenChange,
    }: {
      onStyleChange?: (_: unknown) => void;
      onOpenChange?: (_: boolean) => void;
    }) {
      const [menuOpen, setMenuOpen] = useState(false);
      useEffect(() => {
        if (!menuOpen) {
          return;
        }
        const onKeyDown = (event: KeyboardEvent) => {
          if (event.key === 'Escape') {
            setMenuOpen(false);
            onOpenChange?.(false);
          }
        };
        globalThis.addEventListener('keydown', onKeyDown, true);
        return () => globalThis.removeEventListener('keydown', onKeyDown, true);
      }, [menuOpen, onOpenChange]);
      return (
        <>
          <button
            onClick={() => {
              mockChangeStyle('draftStyle');
              onStyleChange?.({ newStyle: { data: 'draftStyle' } });
            }}
          >
            Change Style
          </button>
          <button
            onClick={() => {
              setMenuOpen(true);
              onOpenChange?.(true);
            }}
          >
            Open Style Menu
          </button>
          {menuOpen && <div data-testid="stub-style-menu" />}
        </>
      );
    },
  };
});

jest.mock('terraso-web-client/storyMap/components/StoryMapLayer', () => ({
  __esModule: true,
  StoryMapLayer: ({ config }: { config: { id: string } }) => (
    <div data-testid={`mock-layer-${config.id}`} />
  ),
}));

jest.mock(
  'terraso-web-client/storyMap/components/StoryMapForm/MapConfigurationDialog/CreateMapLayerDialog',
  () => {
    const { useState, useEffect } = jest.requireActual('react');
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
        // Mirrors the real create dialog: a stacked MUI modal of its own,
        // which closes ITSELF on Escape.
        const [createOpen, setCreateOpen] = useState(false);
        useEffect(() => {
          if (!createOpen) {
            return;
          }
          const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
              setCreateOpen(false);
              onCreateDialogOpenChange?.(false);
            }
          };
          globalThis.addEventListener('keydown', onKeyDown, true);
          return () =>
            globalThis.removeEventListener('keydown', onKeyDown, true);
        }, [createOpen, onCreateDialogOpenChange]);
        return (
          <div data-testid="stub-create-flow">
            <span data-testid="stub-create-file">
              {externalFile?.name ?? ''}
            </span>
            {(createOpen || mockKeepCreateModalMounted) && (
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

// Test-only switch for the create stub: keep its modal root mounted after
// close (simulating an MUI exit transition).
let mockKeepCreateModalMounted = false;

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

// Mirrors StoryMap's single-mount layer stack: the host renders the
// published DRAFT configs on the one mock layer mount per id (the draft is
// a different dataset feeding the same mounts — never a parallel stack).
// Every host render re-renders the dialog (in the app the map context value
// is a fresh object per render, so consumers re-render with the host): a
// publish that re-publishes on re-render loops.
let mockLayerStackPublishes: (MapConfigLayerStack | null)[] = [];

const LayerStackHost = ({ children }: { children: any }) => {
  const [stack, setStack] = useState<MapConfigLayerStack | null>(null);
  return (
    <MapConfigLayerStackProvider
      value={(next: MapConfigLayerStack | null) => {
        mockLayerStackPublishes.push(next);
        setStack(next);
      }}
    >
      {cloneElement(children)}
      {(stack?.configs ?? []).map(mapLayerConfig => (
        <div
          key={mapLayerConfig.id}
          data-testid={`mock-layer-${mapLayerConfig.id}`}
        />
      ))}
    </MapConfigLayerStackProvider>
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
  /** Legacy configs (pre-`dataLayers`) omit the payload entirely. */
  legacyConfig?: boolean;
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
    legacyConfig = false,
  } = options;

  if (dataLayers) {
    dataLayersMock = dataLayers;
  }

  const storyMapConfig = {
    ...createTestStoryMapConfig(),
    ...(legacyConfig ? {} : { dataLayers: configDataLayers }),
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
      <LayerStackHost>
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
      </LayerStackHost>
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
    mockKeepCreateModalMounted = false;
    mockLayerStackPublishes = [];
    dataLayersMock = {};

    // The shared editor map, with a camera the specs can move around.
    mapboxgl.NavigationControl = jest.fn();
    mockMap = createLoadedMapMock({
      getCenter: jest.fn(() => ({ lng: -78.5, lat: -0.23 })),
      getZoom: jest.fn(() => 10),
      getPitch: jest.fn(() => 64),
      getBearing: jest.fn(() => 45),
      getBounds: jest.fn(() => ({
        toArray: () => [
          [-180, -90],
          [180, 90],
        ],
      })),
    });

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

    it('keeps Tab cycling past selector matches that cannot take focus', async () => {
      // react-dropzone's visually-hidden file input matches the focusable
      // selector but refuses focus — the trap must skip it, not wedge the
      // cycle at the element before it. The trap also must never let focus
      // escape the overlay (the editor behind it is inert but still a risk
      // for the focus ORDER).
      await setup();

      const FOCUSABLE = [
        'a[href]',
        'button:not([disabled])',
        'input:not([disabled])',
        'select:not([disabled])',
        'textarea:not([disabled])',
        '[tabindex]:not([tabindex="-1"])',
      ].join(', ');
      const overlay = document.querySelector(
        '[data-testid="map-config-overlay"]'
      ) as HTMLElement;
      // The layer drop zone's visually-hidden file input (react-dropzone)
      // matches the focusable selector but the browser silently refuses to
      // focus it. jsdom does not model the refusal: pin it on the real
      // element to reproduce the browser contract.
      const deadInput = overlay.querySelector(
        'input[type="file"]'
      ) as HTMLInputElement;
      expect(deadInput).not.toBeNull();
      deadInput.focus = () => {};
      const count = overlay.querySelectorAll(FOCUSABLE).length;
      const first = overlay.querySelectorAll(FOCUSABLE)[0];

      let firstVisits = 0;
      let escaped = false;
      await act(async () => {
        for (let i = 0; i < 2 * count; i++) {
          fireEvent.keyDown(window, { key: 'Tab' });
          if (document.activeElement === first) {
            firstVisits += 1;
          }
          if (
            !overlay.contains(document.activeElement) &&
            document.activeElement !== first
          ) {
            escaped = true;
          }
        }
      });

      // Wrapped at least once: the cycle survives the dead target.
      expect(firstVisits).toBeGreaterThanOrEqual(2);
      expect(escaped).toBe(false);
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
      // (300px is the spec: same dimensions as RightSidebar, padding inside).
      expect(screen.getByTestId('map-config-layers-panel')).toHaveStyle({
        width: '300px',
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
      // No background paint over the live editor map. jsdom resolves the
      // emotion stylesheets and reports its transparent default
      // `rgba(0, 0, 0, 0)` — anything painted would show up here (the old
      // `''` escape made this assertion a tautology).
      expect(getComputedStyle(mapWindow).backgroundColor).toBe(
        'rgba(0, 0, 0, 0)'
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

    it('sends the map camera recorded from the shared map', async () => {
      const { onConfirmMock } = await setup({
        location: createTestPosition(),
      });

      // The user drags the shared map: the camera moves.
      (mockMap.getCenter as jest.Mock).mockReturnValue({ lng: 12, lat: 34 });
      (mockMap.getZoom as jest.Mock).mockReturnValue(7);
      (mockMap.getPitch as jest.Mock).mockReturnValue(10);
      (mockMap.getBearing as jest.Mock).mockReturnValue(20);
      await act(async () => {
        mockMap.fire('move');
      });

      await act(async () => {
        fireEvent.click(saveButton());
      });

      // The payload carries the camera MapLocationChange recorded from the
      // live map — not a prop passthrough.
      const payload = onConfirmMock.mock.calls[0][0];
      expect(payload.location).toEqual({
        center: { lng: 12, lat: 34 },
        zoom: 7,
        pitch: 10,
        bearing: 20,
        bounds: [-180, -90, 180, 90],
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

  describe('Test Suite 6: Session teardown on the shared editor map', () => {
    const CONFIG_STYLE = createTestStoryMapConfig().style;

    // The user drafts a basemap change (applied live to the shared map) and
    // drags the camera.
    const draftOnSharedMap = async () => {
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Change Style' }));
      });
      expect(mockChangeStyle).toHaveBeenCalledWith('draftStyle');
      (mockMap.getCenter as jest.Mock).mockReturnValue({ lng: 5, lat: 5 });
      (mockMap.getZoom as jest.Mock).mockReturnValue(3);
      (mockMap.getPitch as jest.Mock).mockReturnValue(0);
      (mockMap.getBearing as jest.Mock).mockReturnValue(0);
      await act(async () => {
        mockMap.fire('move');
      });
    };

    it('restores the basemap AND the camera when the session ends without confirm', async () => {
      const { renderResult, onCloseMock, onConfirmMock } = await setup({
        location: createTestPosition(),
      });
      await draftOnSharedMap();

      // Cancel ends the session: the host unmounts the overlay (X, Escape,
      // target swap and navigate-away all unwind the same way — one
      // teardown path).
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
      });
      expect(onCloseMock).toHaveBeenCalled();
      await act(async () => {
        renderResult.unmount();
      });

      expect(onConfirmMock).not.toHaveBeenCalled();
      // Basemap draft discarded …
      expect(mockChangeStyle).toHaveBeenLastCalledWith(CONFIG_STYLE);
      // … camera draft discarded: the snapshot taken when the session
      // opened is replayed (never the dragged camera).
      expect(mockMap.jumpTo).toHaveBeenLastCalledWith({
        center: { lng: -78.5, lat: -0.23 },
        zoom: 10,
        pitch: 64,
        bearing: 45,
      });
    });

    it('takes no restore action on a plain close without drafts', async () => {
      const { renderResult } = await setup();

      await act(async () => {
        renderResult.unmount();
      });

      expect(mockChangeStyle).not.toHaveBeenCalled();
    });

    it('does not restore anything when the change is confirmed', async () => {
      const { renderResult, onConfirmMock } = await setup();
      await draftOnSharedMap();

      await act(async () => {
        fireEvent.click(saveButton());
      });
      expect(onConfirmMock).toHaveBeenCalledWith(
        expect.objectContaining({ mapStyle: 'draftStyle' })
      );

      mockChangeStyle.mockClear();
      mockMap.jumpTo.mockClear();
      await act(async () => {
        renderResult.unmount();
      });

      // The confirmed draft is now the config: no restore on teardown.
      expect(mockChangeStyle).not.toHaveBeenCalled();
      expect(mockMap.jumpTo).not.toHaveBeenCalled();
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

    it('a title session (no chapterId) inits and discards its camera like a chapter session', async () => {
      // Title session parity: `chapterId` is undefined, so the camera init
      // runs the whole initialLocation fallback chain (own location → chapter
      // lookup skipped → title transition → first chapter with a location).
      const titleLocation = createTestStoryMapConfig().titleTransition
        ?.location as any;
      const { renderResult } = await setup({
        chapterId: undefined,
        title: 'Edit map title',
        location: undefined,
      });

      // The camera lands on the title transition's starting position: the
      // shared camera is replayed through `jumpTo` (this harness has no
      // `mapDimensions`, so `locationFitViewport` is skipped and the raw
      // location camera is restored — never a `fitBounds` fit).
      expect(mockMap.jumpTo).toHaveBeenCalledWith({
        center: titleLocation.center,
        zoom: titleLocation.zoom,
        pitch: titleLocation.pitch,
        bearing: titleLocation.bearing,
      });

      // …and the session teardown restores the session-open snapshot on a
      // close without confirm, exactly like a chapter session.
      (mockMap.getCenter as jest.Mock).mockReturnValue({ lng: 5, lat: 5 });
      (mockMap.getZoom as jest.Mock).mockReturnValue(3);
      await act(async () => {
        mockMap.fire('move');
      });
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
      });
      await act(async () => {
        renderResult.unmount();
      });
      expect(mockMap.jumpTo).toHaveBeenLastCalledWith({
        center: { lng: -78.5, lat: -0.23 },
        zoom: 10,
        pitch: 64,
        bearing: 45,
      });
    });

    it('publishes the draft stack exactly once per change (no publish loop)', async () => {
      // Legacy configs leave `config.dataLayers` UNDEFINED. A destructuring
      // default of `{}` mints a new object per render — every draft memo
      // downstream churns and the stack publish then fires per render:
      // publish → host render → dialog re-render → publish → …, until React
      // throws "Maximum update depth exceeded". The host re-renders the
      // dialog on every publish (the app's map context churns the same way),
      // so the loop reproduces here.
      await setup({ legacyConfig: true });
      const settled = mockLayerStackPublishes.length;

      // No user change: pending renders must not re-publish the draft.
      await act(async () => {});
      expect(mockLayerStackPublishes).toHaveLength(settled);

      // A real draft change publishes exactly once more — the host render
      // that publish causes must not re-publish the (unchanged) draft.
      await act(async () => {
        fireEvent.click(
          screen.getByRole('treeitem', { name: 'Story Map Layer 1' })
        );
      });
      expect(mockLayerStackPublishes).toHaveLength(settled + 1);
    });
  });

  describe('Test Suite 7: Escape routing with stacked sub-dialogs', () => {
    it('absorbs Escape for a self-closing sub-dialog, then cancels the overlay', async () => {
      const { onCloseMock } = await setup();

      await act(async () => {
        fireEvent.click(
          screen.getByRole('button', { name: 'stub-open-create' })
        );
      });
      expect(screen.getByTestId('stub-create-modal')).toBeInTheDocument();

      // First Escape belongs to the create dialog, which closes ITSELF
      // (its modal root is gone immediately — the race the old DOM probe
      // lost). The overlay absorbs the key and stays open.
      await act(async () => {
        fireEvent.keyDown(window, { key: 'Escape' });
      });
      expect(onCloseMock).not.toHaveBeenCalled();
      expect(screen.queryByTestId('stub-create-modal')).not.toBeInTheDocument();

      // With no sub-dialog open, the next Escape cancels the overlay.
      await act(async () => {
        fireEvent.keyDown(window, { key: 'Escape' });
      });
      expect(onCloseMock).toHaveBeenCalled();
    });

    it('is not confused by a modal root lingering through an exit transition', async () => {
      const { onCloseMock } = await setup();
      // The sub-dialog's modal root stays mounted for its MUI exit
      // transition after it closed — Escape routing is state-based, so the
      // stale DOM node must not eat the next key.
      mockKeepCreateModalMounted = true;

      await act(async () => {
        fireEvent.click(
          screen.getByRole('button', { name: 'stub-open-create' })
        );
      });
      await act(async () => {
        fireEvent.keyDown(window, { key: 'Escape' });
      });
      expect(onCloseMock).not.toHaveBeenCalled();
      // The exit transition is still running: the modal root is still there.
      expect(screen.getByTestId('stub-create-modal')).toBeInTheDocument();

      // Deterministic: the overlay still cancels on the next Escape.
      await act(async () => {
        fireEvent.keyDown(window, { key: 'Escape' });
      });
      expect(onCloseMock).toHaveBeenCalled();
    });

    it('routes Escape to the basemap style menu first', async () => {
      const { onCloseMock } = await setup();

      await act(async () => {
        fireEvent.click(
          screen.getByRole('button', { name: 'Open Style Menu' })
        );
      });
      expect(screen.getByTestId('stub-style-menu')).toBeInTheDocument();

      // The open menu is the topmost sub-dialog: it closes itself on this
      // Escape; the overlay is untouched.
      await act(async () => {
        fireEvent.keyDown(window, { key: 'Escape' });
      });
      expect(onCloseMock).not.toHaveBeenCalled();
      expect(screen.queryByTestId('stub-style-menu')).not.toBeInTheDocument();

      await act(async () => {
        fireEvent.keyDown(window, { key: 'Escape' });
      });
      expect(onCloseMock).toHaveBeenCalled();
    });

    it('routes Escape to the set-map helper first', async () => {
      const { onCloseMock } = await setup();

      await act(async () => {
        fireEvent.click(
          screen.getByRole('button', {
            name: 'Set the location, basemap style, and add layers',
          })
        );
      });
      expect(screen.getByText(/Step 1\. Find a location/)).toBeInTheDocument();

      // Escape while the helper is stacked must not cancel the overlay: the
      // helper (topmost) gets the key first and closes itself.
      const helperDialog = document.querySelector('.MuiPopover-root');
      expect(helperDialog).not.toBeNull();
      await act(async () => {
        fireEvent.keyDown(helperDialog!, { key: 'Escape' });
      });
      expect(onCloseMock).not.toHaveBeenCalled();

      // With the helper closed (its flag cleared — no waiting out of exit
      // transitions), Escape cancels the overlay.
      await act(async () => {
        fireEvent.keyDown(window, { key: 'Escape' });
      });
      expect(onCloseMock).toHaveBeenCalled();
    });
  });
});
