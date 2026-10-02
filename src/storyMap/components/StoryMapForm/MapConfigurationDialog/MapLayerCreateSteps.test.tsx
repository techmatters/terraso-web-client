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
  screen,
  waitFor,
} from 'terraso-web-client/tests/utils';
import * as terrasoApi from 'terraso-client-shared/terrasoApi/api';

import * as visualizationUtils from 'terraso-web-client/sharedData/visualization/visualizationUtils';
import { MapLayerCreateSessionProvider } from 'terraso-web-client/storyMap/components/StoryMapForm/MapConfigurationDialog/MapLayerCreateSession';
import { MapLayerCreateSteps } from 'terraso-web-client/storyMap/components/StoryMapForm/MapConfigurationDialog/MapLayerCreateSteps';

import theme from 'terraso-web-client/theme';

jest.mock('terraso-client-shared/terrasoApi/api');

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
        onUploadingChange,
      }: {
        externalFile?: File;
        onCompleteSuccess: (dataEntry: unknown) => void;
        onUploadingChange?: (uploading: boolean) => void;
      }) => (
        <div data-testid="stub-file-upload">
          <span data-testid="stub-create-file">{externalFile?.name ?? ''}</span>
          <button type="button" onClick={() => onUploadingChange?.(true)}>
            stub-uploading
          </button>
          <button
            onClick={() => {
              onUploadingChange?.(false);
              onCompleteSuccess(
                createTestDataEntryNode({
                  name: externalFile?.name ?? 'points.geojson',
                  resourceType:
                    externalFile?.name?.split('.').pop() ?? 'geojson',
                })
              );
            }}
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

// Leaf widgets are stubbed as buttons that drive the REAL useVisualizeForm
// setters, so form value changes travel the real onChange chain to the
// visualization context (and thus to the shared-map preview).
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
        id={id}
        value={field.value ?? ''}
        onChange={event => field.onChange(event.target.value)}
      />
    ),
  })
);

jest.mock('terraso-web-client/collaboration/collaborationContext', () => ({
  __esModule: true,
  CollaborationContextProvider: ({ children }: { children: any }) => children,
  useCollaborationContext: () => ({
    owner: { id: 'story-map-id' },
    entityType: 'story_map',
  }),
}));

const ADD_MAP_LAYER_MUTATION_MARKER = 'addVisualizationConfig';

const mockAddMapLayerResponse = () =>
  (terrasoApi.requestGraphQL as jest.Mock).mockResolvedValue({
    addVisualizationConfig: {
      visualizationConfig: {
        id: 'created-1',
        title: 'Created layer',
        description: '',
        configuration: JSON.stringify({
          visualizeConfig: {
            shape: 'circle',
            opacity: 50,
            size: 15,
            color: '#000000',
          },
        }),
      },
      errors: [],
    },
  });

const createFile = (name = 'points.geojson', type = 'application/geo+json') =>
  new File(['x'], name, { type });

const setup = async ({
  file = createFile(),
  isMapFile = true,
}: { file?: File; isMapFile?: boolean } = {}) => {
  const onCreate = jest.fn();
  const onCancel = jest.fn();
  await render(
    <MapLayerCreateSessionProvider file={file}>
      <MapLayerCreateSteps
        file={file}
        title="Chapter 1"
        onCreate={onCreate}
        onCancel={onCancel}
      />
    </MapLayerCreateSessionProvider>,
    {
      storyMap: { dataLayers: { saving: false, fetching: false, list: [] } },
    }
  );
  return { onCreate, onCancel, file, isMapFile };
};

const startCreation = async (options: Parameters<typeof setup>[0] = {}) => {
  const utils = await setup(options);
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: 'stub-upload-done' }));
  });
  await waitFor(() => {
    expect(screen.getByLabelText(/^Layer Title/)).toBeInTheDocument();
  });
  return utils;
};

beforeEach(() => {
  jest.clearAllMocks();
  mockAddMapLayerResponse();
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

describe('MapLayerCreateSteps', () => {
  describe('upload flow', () => {
    test('starts the upload with the session file and shows a loading state', async () => {
      await setup();

      // The picked/dropped file is handed to the upload machinery.
      expect(screen.getByTestId('stub-create-file')).toHaveTextContent(
        'points.geojson'
      );
      // No form before the file is uploaded and parsed.
      expect(screen.queryByLabelText('Layer Title')).not.toBeInTheDocument();

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'stub-uploading' }));
      });
      expect(screen.getByRole('progressbar')).toBeInTheDocument();

      await act(async () => {
        fireEvent.click(
          screen.getByRole('button', { name: 'stub-upload-done' })
        );
      });
      await waitFor(() => {
        expect(screen.getByLabelText(/^Layer Title/)).toBeInTheDocument();
      });
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    test('surfaces a file load error and keeps the cancel affordance', async () => {
      (visualizationUtils.readMapFile as jest.Mock).mockRejectedValueOnce(
        new Error('boom')
      );
      const { onCancel } = await setup();

      await act(async () => {
        fireEvent.click(
          screen.getByRole('button', { name: 'stub-upload-done' })
        );
      });

      await waitFor(() => {
        expect(screen.getByText(/could not be parsed/i)).toBeInTheDocument();
      });
      expect(screen.queryByLabelText(/^Layer Title/)).not.toBeInTheDocument();

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Back to layers' }));
      });
      expect(onCancel).toHaveBeenCalled();
    });
  });

  describe('config fields', () => {
    test('renders the layer title and visualize fields for a map file', async () => {
      await startCreation();

      const title = screen.getByLabelText(/^Layer Title/);
      expect(title).toHaveValue('points.geojson');
      // Map files: no dataset column mapping.
      expect(screen.queryByLabelText(/^Latitude/)).not.toBeInTheDocument();
      expect(screen.queryByLabelText(/^Longitude/)).not.toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: 'stub-color' })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: 'stub-opacity' })
      ).toBeInTheDocument();
    });

    test('renders lat/lng column mapping for a dataset file', async () => {
      await startCreation({
        file: createFile('points.csv', 'text/csv'),
      });

      // Dataset files add the coordinate column mapping (pre-filled by
      // identifyLatLngColumns).
      expect(screen.getByLabelText(/^Latitude/)).toHaveValue('lat');
      expect(screen.getByLabelText(/^Longitude/)).toHaveValue('lng');
    });
  });

  describe('create mutation', () => {
    test('dispatches the create mutation and reports the created layer', async () => {
      const { onCreate, onCancel } = await startCreation();

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Add map layer' }));
      });

      await waitFor(() => {
        expect(onCreate).toHaveBeenCalledWith(
          expect.objectContaining({ id: 'created-1' })
        );
      });
      expect(onCancel).not.toHaveBeenCalled();

      const [, variables] =
        (terrasoApi.requestGraphQL as jest.Mock).mock.calls.find(([query]) =>
          String(query).includes(ADD_MAP_LAYER_MUTATION_MARKER)
        ) ?? [];
      expect(variables).toEqual(
        expect.objectContaining({
          input: expect.objectContaining({
            title: 'points.geojson',
            dataEntryId: 'test-data-entry-id',
            ownerId: 'story-map-id',
            ownerType: 'story_map',
          }),
        })
      );
      // The stored configuration carries the visualize config and NO
      // preview-only annotate fields.
      const configuration = JSON.parse(variables.input.configuration);
      expect(configuration.visualizeConfig).toEqual({
        shape: 'circle',
        opacity: 50,
        size: 15,
        color: theme.palette.visualization.markerDefaultColor,
      });
      expect(configuration.annotateConfig.mapTitle).toBeUndefined();
      expect(configuration.selectedFile).toBeUndefined();
    });

    test('live visualization changes are part of the create payload', async () => {
      await startCreation();

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'stub-color' }));
      });
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Add map layer' }));
      });

      await waitFor(() => {
        expect(terrasoApi.requestGraphQL).toHaveBeenCalledWith(
          expect.stringContaining(ADD_MAP_LAYER_MUTATION_MARKER),
          expect.anything()
        );
      });
      const [, variables] =
        (terrasoApi.requestGraphQL as jest.Mock).mock.calls.find(([query]) =>
          String(query).includes(ADD_MAP_LAYER_MUTATION_MARKER)
        ) ?? [];
      expect(
        JSON.parse(variables.input.configuration).visualizeConfig.color
      ).toBe('#123456');
    });

    test('invalid form blocks the create mutation', async () => {
      const { onCreate } = await startCreation();

      await act(async () => {
        fireEvent.change(screen.getByLabelText(/^Layer Title/), {
          target: { value: '' },
        });
      });
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Add map layer' }));
      });

      expect(terrasoApi.requestGraphQL).not.toHaveBeenCalled();
      expect(onCreate).not.toHaveBeenCalled();
    });
  });

  describe('cancel', () => {
    test('cancel reports back without creating anything', async () => {
      const { onCreate, onCancel } = await startCreation();

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Back to layers' }));
      });

      expect(onCancel).toHaveBeenCalled();
      expect(onCreate).not.toHaveBeenCalled();
      expect(terrasoApi.requestGraphQL).not.toHaveBeenCalled();
    });
  });
});
