/*
 * Copyright © 2021-2023 Technology Matters
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
import { act, fireEvent, render, screen, waitFor, within } from 'tests/utils';
import { useParams } from 'react-router-dom';
import * as terrasoApi from 'terraso-client-shared/terrasoApi/api';

import mapboxgl from 'gis/mapbox';
import * as visualizationMarkers from 'sharedData/visualization/visualizationMarkers';

import LandscapeSharedDataVisualizationConfig from './LandscapeSharedDataVisualizationConfig';

jest.mock('terraso-client-shared/terrasoApi/api');
jest.mock('sharedData/visualization/visualizationMarkers');
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: jest.fn(),
}));
jest.mock('gis/mapbox', () => ({}));

const TEST_CSV = `
col1,col2,col_longitude,col3,col4
val1,val2,10,30,val4
`.trim();

const setup = async () => {
  await render(<LandscapeSharedDataVisualizationConfig />, {
    account: {
      currentUser: {
        data: {
          email: 'email@example.com',
          firstName: 'First',
          lastName: 'Last',
        },
      },
    },
  });
};

beforeEach(() => {
  global.fetch = jest.fn();
  mapboxgl.Popup = jest.fn();
  const Popup = {
    setLngLat: jest.fn().mockReturnThis(),
    setMaxWidth: jest.fn().mockReturnThis(),
    setDOMContent: jest.fn().mockReturnThis(),
    addTo: jest.fn().mockReturnThis(),
    remove: jest.fn(),
  };
  mapboxgl.Popup.mockReturnValue(Popup);
  mapboxgl.NavigationControl = jest.fn();
  mapboxgl.LngLatBounds = jest.fn();
  mapboxgl.LngLatBounds.prototype = {
    isEmpty: jest.fn().mockReturnValue(false),
  };
  mapboxgl.Map = jest.fn();
});

const testSelectDataFileStep = async () => {
  const filesList = within(screen.getByRole('list', { name: 'Data File' }));
  const nextButton = screen.getByRole('button', { name: 'Next' });

  expect(nextButton).toHaveAttribute('disabled');

  fireEvent.click(filesList.getByRole('radio', { name: 'File 1' }));

  expect(nextButton).not.toHaveAttribute('disabled');

  await act(async () => fireEvent.click(nextButton));
};

const validateSelectValue = async (name, value) => {
  const select = screen.getByRole('button', { name });
  await act(async () => fireEvent.mouseDown(select));
  expect(
    within(screen.getByRole('listbox', { name })).getByRole('option', {
      name: value,
    })
  ).toHaveAttribute('aria-selected', 'true');
  await act(async () =>
    fireEvent.click(
      within(screen.getByRole('listbox', { name })).getByRole('option', {
        name: value,
      })
    )
  );
};
const changeSelectOption = async (name, newValue) => {
  await screen.findByRole('button', { name });
  const select = screen.getByRole('button', { name });

  await act(async () => fireEvent.mouseDown(select));
  await act(async () =>
    fireEvent.click(
      within(screen.getByRole('listbox', { name })).getByRole('option', {
        name: newValue,
      })
    )
  );
  await validateSelectValue(name, newValue);
};

const testSetDatasetStep = async () => {
  await waitFor(() =>
    expect(screen.getByRole('heading', { name: 'Data from “File 1”' }))
  );

  await changeSelectOption('Latitude (required)', 'col3');
  await validateSelectValue('Longitude (required)', 'col_longitude');

  await changeSelectOption('Column 1', 'col1');
  await changeSelectOption('Column 3', 'col4');
  await act(async () =>
    fireEvent.click(screen.getByRole('button', { name: 'Next' }))
  );
};

const testVisualizeStep = async () => {
  // Shape
  const shapes = screen.getByRole('group', { name: 'Shape:' });
  expect(
    within(shapes).getByRole('button', { name: 'Circle' })
  ).toHaveAttribute('aria-pressed', 'true');
  await act(async () =>
    fireEvent.click(within(shapes).getByRole('button', { name: 'Triangle' }))
  );

  // Size
  const size = screen.getByRole('spinbutton', { name: 'Size:' });
  expect(size).toHaveValue(15);
  fireEvent.change(size, { target: { value: 30 } });
  expect(size).toHaveValue(30);

  // Color
  // TODO Known testing library issue: https://github.com/testing-library/user-event/issues/423#issuecomment-669368863
  // Input type color not supported
  const colorInput = screen.getByLabelText('Color:');
  expect(colorInput).toHaveValue('#ff580d');
  await act(async () =>
    fireEvent.input(colorInput, { target: { value: '#e28979' } })
  );
  expect(colorInput).toHaveValue('#e28979');

  // Next
  await act(async () =>
    fireEvent.click(screen.getByRole('button', { name: 'Next' }))
  );
};

const testAnnotateStep = async () => {
  // Map Title
  const mapTitle = screen.getByRole('textbox', {
    name: 'Map Title (required)',
  });
  await act(async () =>
    fireEvent.click(screen.getByRole('button', { name: 'Next' }))
  );
  expect(screen.getByText(/Enter a map title/i)).toBeInTheDocument();
  await act(async () =>
    fireEvent.change(mapTitle, { target: { value: 'Test Title' } })
  );
  expect(mapTitle).toHaveValue('Test Title');

  // Popup title
  await changeSelectOption('Pop-up Title', 'col4');

  // Data points labels
  const dataPoint = screen.getByRole('textbox', { name: 'Data point 1 label' });
  await act(async () =>
    fireEvent.change(dataPoint, { target: { value: 'Custom Label' } })
  );

  // Next
  await act(async () =>
    fireEvent.click(screen.getByRole('button', { name: 'Next' }))
  );
};

const testPreviewStep = async (map, events) => {
  const LngLatBounds = jest.requireActual('mapbox-gl').LngLatBounds;
  const LngLat = jest.requireActual('mapbox-gl').LngLat;
  const sw = new LngLat(-76.29042998100137, 8.263885173441716);
  const ne = new LngLat(-67.62077603784013, 11.325606896067784);
  map.getBounds.mockReturnValue(new LngLatBounds(sw, ne));
  await act(async () => events['moveend']());
};

test('LandscapeSharedDataVisualizationConfig: Create visualization', async () => {
  const events = {};
  const map = {
    on: jest.fn().mockImplementation((...args) => {
      const event = args[0];
      const callback = args.length === 2 ? args[1] : args[2];
      const layer = args.length === 2 ? null : args[1];
      events[[event, layer].filter(p => p).join(':')] = callback;

      if (event === 'load') {
        callback();
      }
    }),
    remove: jest.fn(),
    off: jest.fn(),
    addControl: jest.fn(),
    removeControl: jest.fn(),
    addSource: jest.fn(),
    getSource: jest.fn(),
    addLayer: jest.fn(),
    getLayer: jest.fn(),
    setTerrain: jest.fn(),
    hasImage: jest.fn(),
    addImage: jest.fn(),
    fitBounds: jest.fn(),
    getBounds: jest.fn(),
    dragRotate: { disable: jest.fn() },
    touchZoomRotate: { disableRotation: jest.fn() },
  };
  mapboxgl.Map.mockReturnValue(map);
  useParams.mockReturnValue({
    slug: 'landscape-slug',
  });
  terrasoApi.requestGraphQL.mockImplementation(query => {
    const trimmedQuery = query.trim();
    if (trimmedQuery.startsWith('query landscapes')) {
      return Promise.resolve({
        landscapes: {
          edges: [
            {
              node: {
                defaultGroup: {
                  id: '6a625efb-4ec8-45e8-ad6a-eb052cc3fe65',
                  accountMembership: {},
                },
                description: 'dsadsad',
                id: 'e9a65bef-4ef1-4058-bba3-fc73b53eb779',
                location: 'CM',
                name: 'Landscape Test',
                slug: 'landscape-slug',
                website: '',
              },
            },
          ],
        },
      });
    }
    if (trimmedQuery.startsWith('query group')) {
      return Promise.resolve({
        groups: {
          edges: [
            {
              node: {
                dataEntries: {
                  edges: [
                    {
                      node: {
                        createdAt: '2022-05-17T23:32:50.606587+00:00',
                        createdBy: {
                          id: 'dc695d00-d6b4-45b2-ab8d-f48206d998da',
                          lastName: 'Buitrón',
                          firstName: 'José',
                        },
                        description: '',
                        id: 'f00c5564-cf93-471a-94c2-b930cbb0a4f8',
                        name: 'File 1',
                        resourceType: 'text/csv',
                        size: 3565,
                        url: 'https://file-url',
                        visualizations: { edges: [] },
                      },
                    },
                  ],
                },
              },
            },
          ],
        },
      });
    }
    if (trimmedQuery.startsWith('mutation addVisualizationConfig')) {
      return Promise.resolve({
        addVisualizationConfig: {
          visualizationConfig: { id: 'b50b761e-faf8-471d-94ee-4991dc1cbd7f' },
        },
      });
    }
  });
  global.fetch.mockResolvedValue({
    status: 200,
    arrayBuffer: () => {
      const file = new File([TEST_CSV], `test.csv`, { type: 'text/csv' });
      return new Promise(function (resolve, reject) {
        const reader = new FileReader();

        reader.onerror = function onerror(ev) {
          reject(ev.target.error);
        };

        reader.onload = function onload(ev) {
          resolve(ev.target.result);
        };

        reader.readAsArrayBuffer(file);
      });
    },
  });
  visualizationMarkers.getLayerImage.mockResolvedValue(
    'image/svg;base64,abc123'
  );

  await setup();

  await testSelectDataFileStep();
  await testSetDatasetStep();
  await testVisualizeStep();
  await testAnnotateStep();
  await testPreviewStep(map, events);

  // Save
  await act(async () =>
    fireEvent.click(screen.getByRole('button', { name: 'Publish' }))
  );
  expect(terrasoApi.requestGraphQL).toHaveBeenCalledTimes(5);
  const saveCall = terrasoApi.requestGraphQL.mock.calls[4];
  expect(saveCall[1]).toStrictEqual({
    input: {
      groupId: '6a625efb-4ec8-45e8-ad6a-eb052cc3fe65',
      title: 'Test Title',
      configuration: JSON.stringify({
        datasetConfig: {
          dataColumns: { option: 'custom', selectedColumns: ['col1', 'col4'] },
          longitude: 'col_longitude',
          latitude: 'col3',
        },
        visualizeConfig: { shape: 'triangle', size: '30', color: '#FF580D' },
        annotateConfig: {
          annotationTitle: 'col4',
          dataPoints: [{ column: 'col1', label: 'Custom Label' }],
        },
        viewportConfig: {
          bounds: {
            northEast: { lng: -67.62077603784013, lat: 11.325606896067784 },
            southWest: { lng: -76.29042998100137, lat: 8.263885173441716 },
          },
        },
      }),
      dataEntryId: 'f00c5564-cf93-471a-94c2-b930cbb0a4f8',
    },
  });
}, 30000);
