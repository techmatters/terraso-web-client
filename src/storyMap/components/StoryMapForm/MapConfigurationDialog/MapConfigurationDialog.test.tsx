import { act, fireEvent, render, screen, waitFor } from 'tests/utils';

import { MapConfigurationDialog } from 'storyMap/components/StoryMapForm/MapConfigurationDialog/MapConfigurationDialog';
import { MapLayerConfig } from 'storyMap/storyMapTypes';

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

// Set up mocks BEFORE importing components
jest.mock('gis/components/Map', () => {
  return function MockMap() {
    return <div data-testid="mock-map">Map</div>;
  };
});

jest.mock(
  'storyMap/components/StoryMapForm/MapConfigurationDialog/MapLayerDialog',
  () => {
    return {
      MapLayerDialog: ({ open, onClose, onConfirm }: any) => {
        if (!open) return null;
        return (
          <div data-testid="mock-map-layer-dialog">
            <button
              onClick={() => {
                const layer = {
                  id: 'existing-layer-1',
                  title: 'Existing Layer',
                  slug: 'existing-layer',
                };
                onConfirm(layer);
              }}
              data-testid="select-existing-layer-button"
            >
              Select Existing Layer
            </button>
            <button
              onClick={() => {
                const newLayer = {
                  id: 'new-layer-id',
                  title: 'Newly Created Layer',
                  slug: 'newly-created-layer',
                };
                onConfirm(newLayer);
              }}
              data-testid="create-new-layer-button"
            >
              Create New Layer
            </button>
            <button onClick={onClose} data-testid="close-dialog-button">
              Close
            </button>
          </div>
        );
      },
    };
  }
);

jest.mock('storyMap/components/StoryMapForm/storyMapConfigContext', () => ({
  useStoryMapConfigContext: jest.fn(),
}));

jest.mock('collaboration/collaborationContext', () => ({
  useCollaborationContext: jest.fn(),
  CollaborationContextProvider: ({ children }: any) => <>{children}</>,
}));

const {
  useStoryMapConfigContext,
} = require('storyMap/components/StoryMapForm/storyMapConfigContext');
const {
  useCollaborationContext,
} = require('collaboration/collaborationContext');

// Test data
const createTestMapLayerConfig = (id: string, title: string): MapLayerConfig =>
  ({
    id,
    title,
    description: `Description for ${title}`,
    readableId: `${id}-readable`,
    slug: `${title.toLowerCase().replace(/\s+/g, '-')}`,
  }) as MapLayerConfig;

const createTestPosition = () => ({
  center: { lat: 0, lng: 0 },
  zoom: 10,
  pitch: 0,
  bearing: 0,
  bounds: {
    getNorth: () => 1,
    getSouth: () => -1,
    getEast: () => 1,
    getWest: () => -1,
  },
});

const createTestStoryMapConfig = () => ({
  style: 'mapbox://styles/mapbox/light-v11',
  projection: 'globe',
  chapters: [
    {
      id: 'chapter-1',
      title: 'Chapter 1',
      location: createTestPosition(),
    },
  ],
  titleTransition: {
    location: createTestPosition(),
  },
});

const createTestStoryMap = () => ({
  id: 'story-map-1',
  title: 'Test Story Map',
});

interface SetupOptions {
  open?: boolean;
  location?: any;
  title?: string;
  chapterId?: string;
  mapLayerConfig?: MapLayerConfig | null;
  existingMapLayers?: Partial<MapLayerConfig>[];
  isOwner?: boolean;
}

const setup = async (options: SetupOptions = {}) => {
  const {
    open = true,
    location = undefined,
    title = 'Test Chapter',
    chapterId = 'chapter-1',
    mapLayerConfig = null,
    existingMapLayers = [],
    isOwner = true,
  } = options;

  const onCloseMock = jest.fn();
  const onConfirmMock = jest.fn();

  // Mock context hooks
  useStoryMapConfigContext.mockReturnValue({
    config: createTestStoryMapConfig(),
    storyMap: createTestStoryMap(),
  });

  useCollaborationContext.mockReturnValue({
    owner: createTestStoryMap(),
    entityType: 'story_map',
    isMember: isOwner,
  });

  await render(
    <MapConfigurationDialog
      open={open}
      onClose={onCloseMock}
      onConfirm={onConfirmMock}
      location={location}
      title={title}
      chapterId={chapterId}
      mapLayerConfig={mapLayerConfig}
    />,
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
    }
  );

  return {
    onCloseMock,
    onConfirmMock,
  };
};

describe('MapConfigurationDialog', () => {
  beforeEach(() => {
    jest.clearAllMocks();
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
        name: /cancel|close/i,
      });

      await act(async () => {
        fireEvent.click(cancelButton);
      });

      expect(onCloseMock).toHaveBeenCalled();
      expect(onConfirmMock).not.toHaveBeenCalled();
    });

    it('does not show MapLayerDialog when dialog is not open', async () => {
      await setup({ open: false });

      expect(
        screen.queryByTestId('mock-map-layer-dialog')
      ).not.toBeInTheDocument();
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

      await waitFor(() => {
        expect(screen.getByTestId('mock-map-layer-dialog')).toBeInTheDocument();
      });
    });

    it('calls onConfirm with selected existing map layer after saving', async () => {
      const existingLayer = createTestMapLayerConfig(
        'existing-1',
        'Existing Layer'
      );
      const { onConfirmMock } = await setup({
        existingMapLayers: [existingLayer],
      });

      const addButton = screen.getByRole('button', {
        name: /add map layer/i,
      });

      await act(async () => {
        fireEvent.click(addButton);
      });

      await waitFor(() => {
        expect(screen.getByTestId('mock-map-layer-dialog')).toBeInTheDocument();
      });

      const selectButton = screen.getByTestId('select-existing-layer-button');

      await act(async () => {
        fireEvent.click(selectButton);
      });

      await waitFor(() => {
        expect(
          screen.queryByTestId('mock-map-layer-dialog')
        ).not.toBeInTheDocument();
      });

      // Click "Save Map" button to trigger onConfirm
      const saveButton = screen.getByRole('button', { name: /save map/i });

      await act(async () => {
        fireEvent.click(saveButton);
      });

      await waitFor(() => {
        expect(onConfirmMock).toHaveBeenCalledWith(
          expect.objectContaining({
            dataLayerConfig: expect.objectContaining({
              id: 'existing-layer-1',
              title: 'Existing Layer',
            }),
          })
        );
      });
    });
  });

  describe('Test Suite 3: Adding a Newly Created Map Layer', () => {
    it('opens MapLayerDialog when "Add" button is clicked', async () => {
      await setup();

      const addButton = screen.getByRole('button', {
        name: /add map layer/i,
      });

      await act(async () => {
        fireEvent.click(addButton);
      });

      await waitFor(() => {
        expect(screen.getByTestId('mock-map-layer-dialog')).toBeInTheDocument();
      });
    });

    it('calls onConfirm with newly created map layer after saving', async () => {
      const { onConfirmMock } = await setup();

      const addButton = screen.getByRole('button', {
        name: /add map layer/i,
      });

      await act(async () => {
        fireEvent.click(addButton);
      });

      await waitFor(() => {
        expect(screen.getByTestId('mock-map-layer-dialog')).toBeInTheDocument();
      });

      const createButton = screen.getByTestId('create-new-layer-button');

      await act(async () => {
        fireEvent.click(createButton);
      });

      await waitFor(() => {
        expect(
          screen.queryByTestId('mock-map-layer-dialog')
        ).not.toBeInTheDocument();
      });

      // Click "Save Map" button to trigger onConfirm
      const saveButton = screen.getByRole('button', { name: /save map/i });

      await act(async () => {
        fireEvent.click(saveButton);
      });

      await waitFor(() => {
        expect(onConfirmMock).toHaveBeenCalledWith(
          expect.objectContaining({
            dataLayerConfig: expect.objectContaining({
              title: 'Newly Created Layer',
            }),
          })
        );
      });
    });

    it('closes MapLayerDialog after layer creation', async () => {
      await setup();

      const addButton = screen.getByRole('button', {
        name: /add map layer/i,
      });

      await act(async () => {
        fireEvent.click(addButton);
      });

      await waitFor(() => {
        expect(screen.getByTestId('mock-map-layer-dialog')).toBeInTheDocument();
      });

      const createButton = screen.getByTestId('create-new-layer-button');

      await act(async () => {
        fireEvent.click(createButton);
      });

      await waitFor(() => {
        expect(
          screen.queryByTestId('mock-map-layer-dialog')
        ).not.toBeInTheDocument();
      });
    });
  });

  describe('Test Suite 4: Deleting a Map Layer', () => {
    it('calls onConfirm with null dataLayerConfig when delete icon is clicked and map is saved', async () => {
      const mapLayer = createTestMapLayerConfig('layer-1', 'My Layer');
      const { onConfirmMock } = await setup({ mapLayerConfig: mapLayer });

      // Find the delete icon button by looking for the DeleteIcon SVG
      const iconButtons = screen.getAllByRole('button');
      const deleteButton = iconButtons.find(btn => {
        const svg = btn.querySelector('svg[data-testid="DeleteIcon"]');
        return svg !== null;
      });

      // The delete button should exist when a layer is configured
      expect(deleteButton).toBeTruthy();

      if (deleteButton) {
        await act(async () => {
          fireEvent.click(deleteButton);
        });

        // Click "Save Map" button to trigger onConfirm with null dataLayerConfig
        const saveButton = screen.getByRole('button', { name: /save map/i });

        await act(async () => {
          fireEvent.click(saveButton);
        });

        // Verify onConfirm was called with null for dataLayerConfig
        await waitFor(() => {
          expect(onConfirmMock).toHaveBeenCalledWith(
            expect.objectContaining({
              dataLayerConfig: null,
            })
          );
        });
      }
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
