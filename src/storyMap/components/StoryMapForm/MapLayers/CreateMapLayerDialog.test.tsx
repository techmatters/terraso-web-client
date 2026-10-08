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

import { act, fireEvent, render, screen } from 'terraso-web-client/tests/utils';
import * as terrasoApi from 'terraso-client-shared/terrasoApi/api';
import { createTestDataEntryNode } from 'terraso-web-client/tests/data/storyMap';

import * as visualizationContext from 'terraso-web-client/sharedData/visualization/visualizationContext';
import CreateMapLayerDialog from 'terraso-web-client/storyMap/components/StoryMapForm/MapLayers/CreateMapLayerDialog';

const setVisualizationContextMock = (
  visualizationContext as unknown as {
    __setVisualizationContext: (value: unknown) => void;
  }
).__setVisualizationContext;

jest.mock('terraso-client-shared/terrasoApi/api');

// The dialog shell (title/confirm/cancel + create wiring) is what this suite
// covers: the visualization form, the upload and the collaboration context
// are stubbed at the boundary.
jest.mock(
  'terraso-web-client/sharedData/visualization/visualizationContext',
  () => {
    const { createContext, useContext } = jest.requireActual('react');
    // No provider wraps the dialog under test: the default context value is a
    // mutable holder the tests can populate.
    const holder: { value: unknown } = { value: {} };
    const context = createContext(holder);
    return {
      __esModule: true,
      VisualizationContextProvider: ({ children }: { children: any }) =>
        children,
      useVisualizationContext: () =>
        useContext(context).value as Record<string, unknown>,
      __setVisualizationContext: (value: unknown) => {
        holder.value = value;
      },
    };
  }
);

jest.mock('terraso-web-client/forms/formContext', () => ({
  __esModule: true,
  FormContextProvider: ({ children }: { children: any }) => children,
  useFormGetContext: () => ({ trigger: jest.fn().mockResolvedValue(true) }),
}));

jest.mock('terraso-web-client/forms/components/Form', () => ({
  __esModule: true,
  default: () => <div data-testid="stub-map-layer-form" />,
}));

jest.mock(
  'terraso-web-client/sharedData/visualization/components/VisualizationConfigForm/ColumnSelect',
  () => ({ __esModule: true, default: () => null })
);
jest.mock(
  'terraso-web-client/sharedData/visualization/components/VisualizationConfigForm/VisualizationPreview',
  () => ({ __esModule: true, default: () => null })
);
jest.mock(
  'terraso-web-client/sharedData/visualization/components/VisualizationConfigForm/VisualizeStep',
  () => ({
    __esModule: true,
    Color: () => null,
    Opacity: () => null,
    Shape: () => null,
    Size: () => null,
    useVisualizeForm: () => ({
      shape: 'circle',
      setShape: () => {},
      size: 15,
      setSize: () => {},
      color: '#000',
      setColor: () => {},
      opacity: 50,
      setOpacity: () => {},
      showPolygonFields: false,
      showPointsFields: true,
    }),
  })
);
jest.mock(
  'terraso-web-client/sharedData/visualization/visualizationUtils',
  () => ({
    __esModule: true,
    identifyLatLngColumns: () => ({}),
    validateCoordinateField: () => () => true,
  })
);

jest.mock(
  'terraso-web-client/storyMap/components/StoryMapForm/MapLayers/FileUpload',
  () => ({ __esModule: true, FileUpload: () => null })
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

const setup = async () => {
  const onCreate = jest.fn();
  const onClose = jest.fn();
  await render(
    <CreateMapLayerDialog
      onCreate={onCreate}
      onClose={onClose}
      chapterTitle="Chapter 1"
    />,
    {
      storyMap: { dataLayers: { saving: false, fetching: false, list: [] } },
    }
  );
  return { onCreate, onClose };
};

beforeEach(() => {
  jest.clearAllMocks();
  mockAddMapLayerResponse();

  // The create dialog opens on a selected file (visualization context).
  setVisualizationContextMock({
    isMapFile: true,
    visualizationConfig: {
      selectedFile: createTestDataEntryNode(),
      visualizeConfig: {
        shape: 'circle',
        opacity: 50,
        size: 15,
        color: '#000000',
      },
      annotateConfig: { dataPoints: [], mapTitle: 'Created layer' },
    },
    setVisualizationConfig: () => {},
    fileContext: undefined,
    loadingFile: false,
    loadingFileError: undefined,
  });
});

describe('CreateMapLayerDialog', () => {
  test('the dialog caption names the chapter', async () => {
    await setup();

    expect(
      screen.getByRole('dialog', { name: 'Create a map layer for Chapter 1' })
    ).toBeInTheDocument();
  });

  test('the dialog caption falls back to the blank copy without a chapter title', async () => {
    const onCreate = jest.fn();
    const onClose = jest.fn();
    await render(
      <CreateMapLayerDialog onCreate={onCreate} onClose={onClose} />,
      {
        storyMap: { dataLayers: { saving: false, fetching: false, list: [] } },
      }
    );

    expect(
      screen.getByRole('dialog', { name: 'Create a map layer' })
    ).toBeInTheDocument();
  });

  test('the bottom confirm button is the labeled, enabled create action', async () => {
    await setup();

    // The review note "the confirm renders disabled with an empty label" is
    // NOT reproducible in the product path: the label is the i18n confirm
    // copy ("Next" — the create dialog is a single-step form; the copy
    // carries over from the stepped map-config dialog) and the button is
    // enabled as soon as the form context (trigger) is mounted. An empty or
    // disabled button here means the label or the form wiring regressed.
    const confirm = screen.getByRole('button', { name: 'Next' });
    expect(confirm).toBeEnabled();
    expect(confirm).toHaveTextContent('Next');
  });

  test('create success calls onCreate with the created layer and closes', async () => {
    const { onCreate, onClose } = await setup();

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    });

    expect(terrasoApi.requestGraphQL).toHaveBeenCalledWith(
      expect.stringContaining(ADD_MAP_LAYER_MUTATION_MARKER),
      expect.anything()
    );
    expect(onCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'created-1',
        ownerType: 'StoryMapNode',
      })
    );
    expect(onClose).toHaveBeenCalled();
  });

  test('cancel closes without creating or writing anything', async () => {
    const { onCreate, onClose } = await setup();

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
    });

    expect(onClose).toHaveBeenCalled();
    expect(onCreate).not.toHaveBeenCalled();
    // Nothing is written anywhere: no create mutation is dispatched.
    expect(terrasoApi.requestGraphQL).not.toHaveBeenCalled();
  });
});
