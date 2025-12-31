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

import { act, render, screen, waitFor } from 'terraso-web-client/tests/utils';
import { useParams } from 'react-router';
import * as terrasoApi from 'terraso-client-shared/terrasoApi/api';

import mapboxgl from 'terraso-web-client/gis/mapbox';
import LandscapeSharedDataVisualization from 'terraso-web-client/landscape/components/LandscapeSharedDataVisualization';
import * as visualizationMarkers from 'terraso-web-client/sharedData/visualization/visualizationMarkers';

jest.mock('terraso-web-client/gis/mapbox', () => ({}));

jest.mock('terraso-client-shared/terrasoApi/api');

jest.mock('terraso-web-client/sharedData/visualization/visualizationMarkers');

jest.mock('react-router', () => ({
  ...jest.requireActual('react-router'),
  useParams: jest.fn(),
}));

const TEST_CSV = `
col1,col2,col_longitude,col3,col4
val1,val2,10,30,val4
val11,val21,10,30,val41
val12,val22,10,30,val42
`.trim();

const setup = async () => {
  await render(<LandscapeSharedDataVisualization />, {
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
  mapboxgl.LngLat = jest.fn();
  mapboxgl.LngLatBounds = jest.fn();
  mapboxgl.LngLatBounds.prototype = {
    extend: jest.fn().mockReturnThis(),
    isEmpty: jest.fn().mockReturnValue(false),
  };
  mapboxgl.NavigationControl = jest.fn();
  mapboxgl.Map = jest.fn();
});

test('LandscapeSharedDataVisualization: Display visualization', async () => {
  const Popup = {
    setLngLat: jest.fn().mockReturnThis(),
    setMaxWidth: jest.fn().mockReturnThis(),
    setDOMContent: jest.fn().mockReturnThis(),
    addTo: jest.fn().mockReturnThis(),
    remove: jest.fn(),
    isOpen: jest.fn(),
  };
  mapboxgl.Popup.mockReturnValue(Popup);
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
    getCanvas: jest.fn(),
    addControl: jest.fn(),
    removeControl: jest.fn(),
    addSource: jest.fn(),
    getSource: jest.fn(),
    addLayer: jest.fn(),
    getLayer: jest.fn(),
    addImage: jest.fn(),
    setTerrain: jest.fn(),
    fitBounds: jest.fn(),
    getStyle: jest.fn(),
    hasImage: jest.fn(),
    setPadding: jest.fn(),
    dragRotate: { disable: jest.fn() },
    touchZoomRotate: { disableRotation: jest.fn() },
  };
  mapboxgl.Map.mockReturnValue(map);
  map.getSource.mockReturnValueOnce();
  map.getSource.mockReturnValueOnce({
    setData: jest.fn(),
    loaded: jest.fn().mockReturnValue(true),
  });
  useParams.mockReturnValue({
    groupSlug: 'slug-1',
    configSlug: 'config-slug',
    readableId: 'readable-id',
  });
  terrasoApi.requestGraphQL.mockImplementation(query => {
    const trimmedQuery = query.trim();
    if (trimmedQuery.startsWith('query landscapes')) {
      return Promise.resolve({
        landscapes: {
          edges: [
            {
              node: {
                description: 'dsadsad',
                id: 'e9a65bef-4ef1-4058-bba3-fc73b53eb779',
                location: 'CM',
                name: 'José Landscape Deafult Test 4',
                slug: 'jose-landscape-deafult-test-4',
                website: '',
              },
            },
          ],
        },
      });
    }
    if (trimmedQuery.startsWith('query fetchVisualizationConfig')) {
      return Promise.resolve({
        visualizationConfigs: {
          edges: [
            {
              node: {
                title: 'Test Title',
                description: 'Test Description',
                configuration: JSON.stringify({
                  datasetConfig: {
                    dataColumns: {
                      option: 'custom',
                      selectedColumns: ['col1', 'col4'],
                    },
                    longitude: 'col_longitude',
                    latitude: 'col3',
                  },
                  visualizeConfig: {
                    shape: 'triangle',
                    size: '30',
                    color: '#A96F14',
                  },
                  annotateConfig: {
                    annotationTitle: 'col4',
                    dataPoints: [{ column: 'col1', label: 'Custom Label' }],
                  },
                  viewportConfig: {
                    bounds: {
                      northEast: {
                        lat: 11.325606896067784,
                        lng: -67.62077603784013,
                      },
                      southWest: {
                        lat: 8.263885173441716,
                        lng: -76.29042998100137,
                      },
                    },
                  },
                }),
                createdAt: '2022-09-16T18:03:40.653296+00:00',
                createdBy: {
                  id: 'dc695d00-d6b4-45b2-ab8d-f48206d998da',
                  lastName: 'Buitrón',
                  firstName: 'José',
                },
                dataEntry: {
                  id: '1ccb0208-a693-4ee1-9d29-cd099e28bf72',
                  name: 'BD_ANEI',
                  description: '',
                  resourceType: 'xlsx',
                },
                id: 'a9f5587b-35a2-4d43-9acf-dc9a7919f1e4',
              },
            },
          ],
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

  await screen.findByRole('button', { name: 'Download PNG' });
  expect(terrasoApi.requestGraphQL).toHaveBeenCalledTimes(3);

  expect(
    screen.getByRole('heading', { name: 'Test Title' })
  ).toBeInTheDocument();

  expect(screen.getByText('Test Description')).toBeInTheDocument();

  // Map
  await waitFor(() => expect(map.addSource).toHaveBeenCalledTimes(1));
  expect(map.addSource.mock.calls[0][0]).toEqual('visualization');
  const geojson = map.addSource.mock.calls[0][1].data;
  expect(geojson.features.length).toBe(3);

  expect(map.addLayer).toHaveBeenCalledWith(
    expect.objectContaining({
      id: 'visualization-markers',
      source: 'visualization',
    }),
    undefined
  );
  expect(map.addLayer).toHaveBeenCalledWith(
    expect.objectContaining({
      id: 'visualization-polygons-outline',
      source: 'visualization',
    }),
    undefined
  );
  expect(map.addLayer).toHaveBeenCalledWith(
    expect.objectContaining({
      id: 'visualization-polygons-fill',
      source: 'visualization',
    }),
    undefined
  );

  await act(async () =>
    events['click:visualization-markers']({
      features: [geojson.features[1]],
      lngLat: {
        lng: 0,
        lat: 0,
      },
    })
  );
  expect(Popup.setDOMContent).toHaveBeenCalledTimes(2);
  const domElement = Popup.setDOMContent.mock.calls[1][0];
  expect(domElement.querySelector('h2').textContent).toEqual('val41');
  expect(domElement.querySelector('p').textContent).toEqual(
    'Custom Label: val11'
  );

  // Validate api call input to fetch visualization config
  // It should contain the owner slug and type
  const fetchCall = terrasoApi.requestGraphQL.mock.calls[1];
  expect(fetchCall[1]).toStrictEqual({
    configSlug: 'config-slug',
    ownerSlug: 'jose-landscape-deafult-test-4',
    ownerType: 'landscape',
    readableId: 'readable-id',
  });
});
