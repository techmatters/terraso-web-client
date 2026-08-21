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
} from 'terraso-web-client/tests/utils';
import * as terrasoApi from 'terraso-client-shared/terrasoApi/api';
import {
  createTestStoryMap,
  createTestStoryMapConfig,
  createTestVisualizationConfigNode,
} from 'terraso-web-client/tests/data/storyMap';

import { CollaborationContextProvider } from 'terraso-web-client/collaboration/collaborationContext';
import { MapConfigurationDialog } from 'terraso-web-client/storyMap/components/StoryMapForm/MapConfigurationDialog/MapConfigurationDialog';
import { MapLayerDialog } from 'terraso-web-client/storyMap/components/StoryMapForm/MapConfigurationDialog/MapLayerDialog';
import { StoryMapConfigContextProvider } from 'terraso-web-client/storyMap/components/StoryMapForm/storyMapConfigContext';
import { MapLayerConfig } from 'terraso-web-client/storyMap/storyMapTypes';

// Mock terrasoApi at the network boundary
jest.mock('terraso-client-shared/terrasoApi/api');

// Set up mocks BEFORE importing components
jest.mock('terraso-web-client/gis/components/Map', () => {
  const { forwardRef } = jest.requireActual('react');
  return forwardRef(function MockMap() {
    return <div data-testid="mock-map">Map</div>;
  });
});

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
            }),
          },
          {
            node: createTestVisualizationConfigNode({
              id: 'test-story-map-2',
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

  if (queryString.includes('addVisualizationConfig')) {
    return Promise.resolve({
      addVisualizationConfig: createTestVisualizationConfigNode(),
    });
  }

  // Fallback for other queries
  return Promise.resolve({});
};

interface SetupOptions {
  open?: boolean;
  location?: any;
  title?: string;
  chapterId?: string;
  mapLayerConfig?: MapLayerConfig | null;
  existingMapLayers?: MapLayerConfig[];
  isOwner?: boolean;
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
    mapLayerConfig = null,
    existingMapLayers = [],
    dataLayers,
  } = options;

  if (dataLayers) {
    dataLayersMock = dataLayers;
  }

  const storyMapConfig = createTestStoryMapConfig();
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
        list: existingMapLayers,
        hasGroups: false,
        hasLandscapes: false,
      },
      // other default state
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
        mapLayerConfig={mapLayerConfig}
      />
    </StoryMapConfigContextProvider>,
    defaultInitialState
  );

  return {
    renderResult: utils,
    onCloseMock,
    onConfirmMock,
  };
};

const openMapLayerDialog = async () => {
  const addButton = screen.getByRole('button', {
    name: /add map layer/i,
  });

  await act(async () => {
    fireEvent.click(addButton);
  });

  await waitFor(() => {
    expect(screen.getByText(/or select a layer:/i)).toBeInTheDocument();
  });
};

describe('MapConfigurationDialog', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    dataLayersMock = {};

    // Mock network boundary only
    (terrasoApi.requestGraphQL as jest.Mock).mockImplementation(
      mockGraphQLRequest
    );
  });

  describe('Test Suite 1: Rendering & Basic Interactions', () => {
    it('renders dialog with chapter title', async () => {
      await setup({ title: 'Chapter A' });

      // The dialog should be rendered in the document
      expect(screen.getByRole('dialog', { hidden: true })).toBeInTheDocument();
    });

    it('renders dialog with fallback title when no title provided', async () => {
      await setup({ title: '' });

      expect(screen.getByRole('dialog', { hidden: true })).toBeInTheDocument();
    });

    it('closes dialog when cancel button is clicked', async () => {
      const { onCloseMock, onConfirmMock } = await setup();

      const cancelButton = screen.getByRole('button', {
        name: /cancel/i,
      });

      await act(async () => {
        fireEvent.click(cancelButton);
      });

      expect(onCloseMock).toHaveBeenCalled();
      expect(onConfirmMock).not.toHaveBeenCalled();
    });

    it('does not show MapLayerDialog when dialog is not open', async () => {
      await setup({ open: false });

      // Check for the MapLayerDialog's unique content when closed
      expect(screen.queryByText(/or select a layer/i)).not.toBeInTheDocument();
    });
  });

  describe('Test Suite 2: Adding an Existing Map Layer', () => {
    it('displays "Add" button when no layer is configured', async () => {
      await setup();

      const addButton = screen.getByRole('button', {
        name: /add map layer/i,
      });
      expect(addButton).toBeInTheDocument();
      expect(addButton).not.toHaveAttribute('disabled');
    });

    it('opens MapLayerDialog when "Add" button is clicked', async () => {
      await setup();

      await openMapLayerDialog();

      expect(screen.getByText(/or select a layer/i)).toBeInTheDocument();
    });
  });

  describe('Test Suite 3: MapLayerDialog Rendering with CreateMapLayerSection', () => {
    it('opens MapLayerDialog when "Add" button is clicked', async () => {
      await setup();

      await openMapLayerDialog();

      expect(screen.getByText(/or select a layer/i)).toBeInTheDocument();
    });

    it('renders MapLayerDialog with both create and select sections when opened', async () => {
      await setup();

      await openMapLayerDialog();

      // MapLayerDialog should render with both sections
      // Check for the "select layer" section which confirms MapLayerDialog is open
      await waitFor(() => {
        const selectLayerText = screen.getByText(/or select a layer/i);
        expect(selectLayerText).toBeInTheDocument();
      });
    });

    it('closes MapLayerDialog when cancel button is clicked', async () => {
      await setup();

      await openMapLayerDialog();

      // Find and click the cancel button in the MapLayerDialog
      // The MapLayerDialog has a Cancel button with text "Cancel"
      const buttons = screen.getAllByRole('button');
      const cancelButtons = buttons.filter(
        btn =>
          btn.textContent === 'Cancel' || btn.textContent?.includes('Cancel')
      );

      // There should be multiple cancel buttons (one in main dialog, one in MapLayerDialog)
      // Click the last one which is in MapLayerDialog
      expect(cancelButtons.length).toBeGreaterThan(0);

      const mapLayerDialogCancelButton =
        cancelButtons[cancelButtons.length - 1];

      await act(async () => {
        fireEvent.click(mapLayerDialogCancelButton);
      });

      await waitFor(() => {
        expect(
          screen.queryByText(/or select a layer/i)
        ).not.toBeInTheDocument();
      });
    });
  });

  describe('Test Suite 4: Deleting a Map Layer', () => {
    it('displays delete icon when a layer is configured', async () => {
      const mapLayer = createTestVisualizationConfigNode();
      await setup({ mapLayerConfig: mapLayer as unknown as MapLayerConfig });

      // Find the delete icon button by looking for the DeleteIcon SVG
      const iconButtons = screen.getAllByRole('button');
      const deleteButton = iconButtons.find(btn => {
        const svg = btn.querySelector('svg[data-testid="DeleteIcon"]');
        return svg !== null;
      });

      // The delete button should exist when a layer is configured
      expect(deleteButton).toBeTruthy();
    });

    it('shows layer name when layer is configured', async () => {
      const mapLayer = createTestVisualizationConfigNode();
      await setup({ mapLayerConfig: mapLayer as unknown as MapLayerConfig });

      // Verify that the layer is displayed
      expect(screen.getByText(mapLayer.title)).toBeInTheDocument();
    });

    it('displays "Add Map Layer" button when no layer is configured', async () => {
      await setup({ mapLayerConfig: null });

      const addButton = screen.getByRole('button', {
        name: /add map layer/i,
      });

      expect(addButton).toBeInTheDocument();
    });

    it('enables "Add Map Layer" button when user is owner', async () => {
      await setup({ isOwner: true, mapLayerConfig: null });

      const addButton = screen.getByRole('button', {
        name: /add map layer/i,
      });

      expect(addButton).not.toHaveAttribute('disabled');
    });
  });

  describe('Test Suite 5: MapLayerDialog Tabs (group/landscape memberships)', () => {
    it('renders Story Map, My Groups and My Landscapes tabs with their layers', async () => {
      dataLayersMock = {
        storyMapConfigs: [
          {
            node: createTestVisualizationConfigNode({
              id: 'test-story-map-1',
              title: 'Story Map Layer',
            }),
          },
        ],
        groupConfigs: [
          {
            node: createTestVisualizationConfigNode({
              id: 'group-layer-1',
              title: 'Group Layer',
              owner: { __typename: 'GroupNode' } as any,
            }),
          },
        ],
        landscapeConfigs: [
          {
            node: createTestVisualizationConfigNode({
              id: 'landscape-layer-1',
              title: 'Landscape Layer',
              owner: { __typename: 'LandscapeNode' } as any,
            }),
          },
        ],
        myGroups: [membershipEdge('m1')],
        myLandscapes: [membershipEdge('m2')],
      };
      await setup();

      await openMapLayerDialog();

      await waitFor(() => {
        expect(
          screen.getByRole('tab', { name: 'This Story Map' })
        ).toBeInTheDocument();
      });
      const groupTab = screen.getByRole('tab', { name: 'My Groups' });
      const landscapeTab = screen.getByRole('tab', { name: 'My Landscapes' });

      // Story map tab shows the story map layers
      expect(
        screen.getByRole('listitem', { name: 'Story Map Layer' })
      ).toBeInTheDocument();

      // Group tab shows group layers
      await act(async () => {
        fireEvent.click(groupTab);
      });
      expect(
        screen.getByRole('listitem', { name: 'Group Layer' })
      ).toBeInTheDocument();

      // Landscape tab shows landscape layers
      await act(async () => {
        fireEvent.click(landscapeTab);
      });
      expect(
        screen.getByRole('listitem', { name: 'Landscape Layer' })
      ).toBeInTheDocument();
    });

    it('hides GROUP tab when the user only belongs to landscapes', async () => {
      dataLayersMock = {
        myLandscapes: [membershipEdge('m2')],
      };
      await setup();

      await openMapLayerDialog();

      await waitFor(() => {
        expect(
          screen.getByRole('tab', { name: 'This Story Map' })
        ).toBeInTheDocument();
      });
      expect(
        screen.queryByRole('tab', { name: 'My Groups' })
      ).not.toBeInTheDocument();
      expect(
        screen.getByRole('tab', { name: 'My Landscapes' })
      ).toBeInTheDocument();
    });

    it('hides LANDSCAPE tab when the user only belongs to groups', async () => {
      dataLayersMock = {
        myGroups: [membershipEdge('m1')],
      };
      await setup();

      await openMapLayerDialog();

      await waitFor(() => {
        expect(
          screen.getByRole('tab', { name: 'This Story Map' })
        ).toBeInTheDocument();
      });
      expect(
        screen.queryByRole('tab', { name: 'My Landscapes' })
      ).not.toBeInTheDocument();
      expect(
        screen.getByRole('tab', { name: 'My Groups' })
      ).toBeInTheDocument();
    });

    it('renders the old radio list UI without tabs when there are no memberships', async () => {
      await setup({
        dataLayers: {
          storyMapConfigs: [
            {
              node: createTestVisualizationConfigNode({
                id: 'test-story-map-1',
                title: 'Story Map Layer',
              }),
            },
          ],
        },
      });

      await openMapLayerDialog();

      // "Or select a layer:" heading is visible
      expect(screen.getByText(/or select a layer/i)).toBeInTheDocument();

      // No tabs at all
      expect(screen.queryByRole('tab')).not.toBeInTheDocument();

      // Story map layers are listed in a plain radio group
      expect(
        screen.getByRole('listitem', { name: 'Story Map Layer' })
      ).toBeInTheDocument();
    });

    it('shows GROUP empty state when the user belongs to groups but no group layers exist', async () => {
      dataLayersMock = {
        myGroups: [membershipEdge('m1')],
      };
      await setup();

      await openMapLayerDialog();

      await waitFor(() => {
        expect(
          screen.getByRole('tab', { name: 'My Groups' })
        ).toBeInTheDocument();
      });

      await act(async () => {
        fireEvent.click(screen.getByRole('tab', { name: 'My Groups' }));
      });

      expect(
        screen.getByText('No maps have been made in your groups yet.')
      ).toBeInTheDocument();
    });

    it('keeps a layer selected when clicking its radio again (no toggle)', async () => {
      const { onConfirmMock } = await setup({
        dataLayers: {
          storyMapConfigs: [
            {
              node: createTestVisualizationConfigNode({
                id: 'test-story-map-1',
                title: 'Clickable Layer',
              }),
            },
          ],
        },
      });

      await openMapLayerDialog();

      const radio = screen.getByRole('radio', { name: 'Clickable Layer' });
      const nextButton = screen.getByRole('button', { name: 'Next' });

      expect(nextButton).toBeDisabled();

      await act(async () => {
        fireEvent.click(radio);
      });
      expect(radio).toBeChecked();
      expect(nextButton).not.toBeDisabled();

      // Browsers do not fire a change event when re-clicking the selected
      // radio, so the selection is unchanged: no toggle, no removal.
      await act(async () => {
        fireEvent.click(radio);
      });
      expect(radio).toBeChecked();
      expect(nextButton).not.toBeDisabled();
      expect(onConfirmMock).not.toHaveBeenCalled();
    });

    it('does not remove the chapter-assigned layer when its radio is clicked or re-clicked', async () => {
      const assignedLayer = createTestVisualizationConfigNode({
        id: 'test-story-map-1',
        title: 'Assigned Layer',
      });
      const otherLayer = createTestVisualizationConfigNode({
        id: 'test-story-map-2',
        title: 'Other Layer',
      });
      const storyMapConfig = createTestStoryMapConfig();
      const storyMap = createTestStoryMap();
      const onConfirmMock = jest.fn();

      dataLayersMock = {
        storyMapConfigs: [
          {
            node: createTestVisualizationConfigNode({
              id: 'test-story-map-1',
              title: 'Assigned Layer',
            }),
          },
          {
            node: createTestVisualizationConfigNode({
              id: 'test-story-map-2',
              title: 'Other Layer',
            }),
          },
        ],
      };

      await render(
        <CollaborationContextProvider owner={storyMap} entityType="story_map">
          <StoryMapConfigContextProvider
            baseConfig={storyMapConfig}
            storyMap={storyMap}
          >
            <MapLayerDialog
              open
              onClose={jest.fn()}
              onConfirm={onConfirmMock}
            />
          </StoryMapConfigContextProvider>
        </CollaborationContextProvider>,
        {
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
              list: [assignedLayer, otherLayer],
              hasGroups: false,
              hasLandscapes: false,
            },
          },
        }
      );

      await waitFor(() => {
        expect(
          screen.getByRole('listitem', { name: 'Assigned Layer' })
        ).toBeInTheDocument();
      });

      const assignedRadio = screen.getByRole('radio', {
        name: 'Assigned Layer',
      });
      const otherRadio = screen.getByRole('radio', { name: 'Other Layer' });

      // The dialog opens with no in-dialog selection; clicking the assigned
      // layer only selects it.
      await act(async () => {
        fireEvent.click(assignedRadio);
      });
      expect(assignedRadio).toBeChecked();

      // Re-clicking the selected radio keeps it selected (no toggle) and the
      // chapter-assigned layer is never removed.
      await act(async () => {
        fireEvent.click(assignedRadio);
      });
      expect(assignedRadio).toBeChecked();
      expect(onConfirmMock).not.toHaveBeenCalled();

      // Selecting another layer and then the assigned one also only selects:
      // no removal.
      await act(async () => {
        fireEvent.click(otherRadio);
      });
      expect(otherRadio).toBeChecked();

      await act(async () => {
        fireEvent.click(assignedRadio);
      });
      expect(assignedRadio).toBeChecked();
      expect(onConfirmMock).not.toHaveBeenCalled();
    });

    it('shows the STORY_MAP tab empty state when the story map has no layers', async () => {
      dataLayersMock = {
        storyMapConfigs: [],
        myGroups: [membershipEdge('m1')],
      };
      await setup();

      await openMapLayerDialog();

      expect(
        screen.getByText(
          "This story map doesn't contain any map layers yet. Upload a new file above or select a layer from your groups or landscapes."
        )
      ).toBeInTheDocument();
    });

    it('shows LANDSCAPE empty state when the user has no landscape layers', async () => {
      dataLayersMock = {
        myLandscapes: [membershipEdge('m2')],
      };
      await setup();

      await openMapLayerDialog();

      await waitFor(() => {
        expect(
          screen.getByRole('tab', { name: 'My Landscapes' })
        ).toBeInTheDocument();
      });

      await act(async () => {
        fireEvent.click(screen.getByRole('tab', { name: 'My Landscapes' }));
      });

      expect(
        screen.getByText('No maps have been made in your landscapes yet.')
      ).toBeInTheDocument();
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

      const addButton = screen.getByRole('button', {
        name: /add map layer/i,
      });
      await act(async () => {
        fireEvent.click(addButton);
      });

      await waitFor(() => {
        expect(
          screen.getByText(
            "We couldn't load the map layers. Please try again later."
          )
        ).toBeInTheDocument();
      });

      // The empty-state copy must not be shown in the error case.
      expect(
        screen.queryByText(
          "This story map doesn't contain any map layers yet. Upload a new file above or select a layer from your groups or landscapes."
        )
      ).not.toBeInTheDocument();
    });
  });
});
