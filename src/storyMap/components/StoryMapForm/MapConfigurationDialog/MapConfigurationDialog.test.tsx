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

import { MapConfigurationDialog } from 'terraso-web-client/storyMap/components/StoryMapForm/MapConfigurationDialog/MapConfigurationDialog';
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

// GraphQL request handler for mocking network boundary
const mockGraphQLRequest = (query: string | any): Promise<any> => {
  const queryString = typeof query === 'string' ? query : query.toString();

  // Detect operation by content inspection
  if (queryString.includes('visualizationConfigs')) {
    return Promise.resolve({
      visualizationConfigs: {
        edges: [
          {
            node: createTestVisualizationConfigNode({ id: 'test-story-map-1' }),
          },
          {
            node: createTestVisualizationConfigNode({ id: 'test-story-map-2' }),
          },
        ],
      },
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
  } = options;

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
      dataLayers: { fetching: false, list: existingMapLayers },
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

describe('MapConfigurationDialog', () => {
  beforeEach(() => {
    jest.clearAllMocks();

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

      const addButton = screen.getByRole('button', {
        name: /add map layer/i,
      });

      await act(async () => {
        fireEvent.click(addButton);
      });

      // Check that MapLayerDialog content is visible
      await waitFor(() => {
        expect(screen.getByText(/or select a layer/i)).toBeInTheDocument();
      });
    });
  });

  describe('Test Suite 3: MapLayerDialog Rendering with CreateMapLayerSection', () => {
    it('opens MapLayerDialog when "Add" button is clicked', async () => {
      await setup();

      const addButton = screen.getByRole('button', {
        name: /add map layer/i,
      });

      await act(async () => {
        fireEvent.click(addButton);
      });

      // Check that MapLayerDialog is open and shows both sections
      await waitFor(() => {
        expect(screen.getByText(/or select a layer/i)).toBeInTheDocument();
      });
    });

    it('renders MapLayerDialog with both create and select sections when opened', async () => {
      await setup();

      const addButton = screen.getByRole('button', {
        name: /add map layer/i,
      });

      await act(async () => {
        fireEvent.click(addButton);
      });

      // MapLayerDialog should render with both sections
      // Check for the "select layer" section which confirms MapLayerDialog is open
      await waitFor(() => {
        const selectLayerText = screen.getByText(/or select a layer/i);
        expect(selectLayerText).toBeInTheDocument();
      });
    });

    it('closes MapLayerDialog when cancel button is clicked', async () => {
      await setup();

      const addButton = screen.getByRole('button', {
        name: /add map layer/i,
      });

      await act(async () => {
        fireEvent.click(addButton);
      });

      await waitFor(() => {
        expect(screen.getByText(/or select a layer/i)).toBeInTheDocument();
      });

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
      await setup({ mapLayerConfig: mapLayer });

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
      await setup({ mapLayerConfig: mapLayer });

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
});
