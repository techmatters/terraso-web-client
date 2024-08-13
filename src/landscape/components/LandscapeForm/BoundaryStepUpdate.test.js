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
import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import * as terrasoApi from 'terraso-client-shared/terrasoApi/api';

import mapboxgl from 'gis/mapbox';
import LandscapeBoundaries from 'landscape/components/LandscapeForm/BoundaryStepUpdate';

jest.mock('terraso-client-shared/terrasoApi/api');

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: jest.fn(),
  useNavigate: jest.fn(),
}));

// Mock mapboxgl
jest.mock('gis/mapbox', () => ({}));

const GEOJSON =
  '{"type": "FeatureCollection", "features": [{"type": "Feature", "geometry": {"type": "Polygon", "coordinates": [[[-80.02098083496094, 0.8184536092473124], [-80.04364013671875, 0.8177670337355836], [-80.04844665527342, 0.8184536092473124], [-80.04981994628906, 0.8260059320976082], [-80.07247924804686, 0.802662342941431], [-80.09170532226562, 0.779318620539376], [-80.10063171386719, 0.7532284249372649], [-80.09857177734375, 0.7223319390984623], [-80.09307861328125, 0.7140928403610857], [-80.10337829589842, 0.6955548144696846], [-80.09788513183594, 0.6742703246919985], [-80.08827209472656, 0.6488661346824502], [-80.07797241210938, 0.6495527361122139], [-80.06561279296875, 0.6522991408974699], [-80.06235122680664, 0.6468063298344634], [-80.02098083496094, 0.8184536092473124]]]}, "properties": {}}]}';
const KML = `
  <?xml version="1.0" encoding="UTF-8"?>
  <kml xmlns="http://www.opengis.net/kml/2.2">
    <Document>
      <Placemark>
        <name>Test Polygon</name>
        <Polygon>
          <outerBoundaryIs>
            <LinearRing>
              <coordinates>1,1 2,2 3,3 4,4 1,1</coordinates>
            </LinearRing>
          </outerBoundaryIs>
        </Polygon>
      </Placemark>
    </Document>
  </kml>
`;
const setup = async () => {
  return await render(<LandscapeBoundaries />, {
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

const testGeoJsonParsing = (file, errorMessage) => async () => {
  global.console.error = jest.fn();
  terrasoApi.requestGraphQL.mockReturnValue(
    Promise.resolve({
      landscapes: {
        edges: [
          {
            node: {
              name: 'Landscape Name',
              description: 'Landscape Description',
              website: 'https://www.landscape.org',
            },
          },
        ],
      },
    })
  );
  await setup();

  expect(terrasoApi.requestGraphQL).toHaveBeenCalledTimes(2);

  await act(async () =>
    fireEvent.click(
      screen.getByRole('button', {
        name: 'Upload a map file. Accepted file formats: GeoJSON, GPX, JSON, KML, KMZ, ESRI Shapefile',
      })
    )
  );

  const dropzone = screen.getByRole('button', {
    name: 'Select File Accepted file formats: *.geojson, *.gpx, *.json, *.kml, *.kmz, *.zip Maximum file size: 10 MB',
  });

  const data = {
    dataTransfer: {
      files: [file],
      items: [
        {
          kind: 'file',
          type: file.type,
          getAsFile: () => file,
        },
      ],
      types: ['Files'],
    },
  };
  fireEvent.drop(dropzone, data);
  expect(await within(dropzone).findByText(errorMessage)).toBeInTheDocument();
};

beforeEach(() => {
  useParams.mockReturnValue({
    slug: 'slug-1',
  });
  useNavigate.mockReturnValue(() => {});
  mapboxgl.Map = jest.fn();
  mapboxgl.Map.prototype = {
    on: jest.fn().mockImplementation((...args) => {
      const event = args[0];
      const callback = args.length === 2 ? args[1] : args[2];
      if (event === 'load') {
        callback();
      }
    }),
    addSource: jest.fn(),
    getSource: jest.fn(),
    setTerrain: jest.fn(),
    addLayer: jest.fn(),
    getLayer: jest.fn(),
    remove: jest.fn(),
    addControl: jest.fn(),
    removeControl: jest.fn(),
    fitBounds: jest.fn(),
    getStyle: jest.fn(),
    off: jest.fn(),
  };
  mapboxgl.NavigationControl = jest.fn();
  mapboxgl.LngLatBounds = jest.fn();
});

test('LandscapeBoundaries: Display error', async () => {
  terrasoApi.requestGraphQL.mockRejectedValue(['Load error']);
  await setup();
  expect(screen.getByText(/Load error/i)).toBeInTheDocument();
});
test('LandscapeBoundaries: Display loader', async () => {
  terrasoApi.requestGraphQL.mockReturnValue(new Promise(() => {}));
  await setup();
  const loader = screen.getByRole('progressbar', {
    name: 'Loading',
  });
  expect(loader).toBeInTheDocument();
});

const plainTextFile = new File(['hello'], 'test.json', {
  type: 'application/json',
});
test(
  'LandscapeBoundaries: Select file (plain text, not JSON)',
  testGeoJsonParsing(
    plainTextFile,
    'The file test.json is not a valid JSON file.'
  )
);

const invalidJsonFile = new File(
  [
    '{"type":"FeatureCollection","features":.61687046392973],[-96.064453125,42.74701217318067]]]}}]}',
  ],
  'test.json',
  {
    type: 'application/json',
  }
);
test(
  'LandscapeBoundaries: Select file (invalid JSON)',
  testGeoJsonParsing(
    invalidJsonFile,
    'The file test.json is not a valid JSON file.'
  )
);

const invalidGeoJsonFile = new File(['{"key": "value"}'], 'test.json', {
  type: 'application/json',
});
test(
  'LandscapeBoundaries: Select file (Invalid GeoJSON)',
  testGeoJsonParsing(
    invalidGeoJsonFile,
    'The file test.json is JSON, but is not a valid GeoJSON file.'
  )
);

const invalidGeomtryinGeoJsonFile = new File(
  [
    '{"type":"FeatureCollection","features":[{"type":"Feature","properties":{},"geometry":{"type":"Polygoff","coordinates":[[[-96.064453125,42.74701217318067],[-104.150390625,38.06539235133249],[-93.515625,35.10193405724606],[-85.95703125,38.61687046392973],[-96.064453125,42.74701217318067]]]}}]}',
  ],
  'test.json',
  {
    type: 'application/json',
  }
);
test(
  'LandscapeBoundaries: Select file (Invalid GeoJSON Boundary)',
  testGeoJsonParsing(
    invalidGeomtryinGeoJsonFile,
    'The file test.json is JSON, but is not a valid GeoJSON file.'
  )
);

const emptyGeoJsonFile = new File([''], 'test.json', {
  type: 'application/json',
});
test(
  'LandscapeBoundaries: Select file (empty)',
  testGeoJsonParsing(emptyGeoJsonFile, 'The file test.json is empty.')
);

test('LandscapeBoundaries: Select file', async () => {
  terrasoApi.requestGraphQL.mockReturnValue(
    Promise.resolve({
      landscapes: {
        edges: [
          {
            node: {
              name: 'Landscape Name',
              description: 'Landscape Description',
              website: 'https://www.landscape.org/',
            },
          },
        ],
      },
    })
  );
  await setup();

  expect(terrasoApi.requestGraphQL).toHaveBeenCalledTimes(2);

  await act(async () =>
    fireEvent.click(
      screen.getByRole('button', {
        name: 'Upload a map file. Accepted file formats: GeoJSON, GPX, JSON, KML, KMZ, ESRI Shapefile',
      })
    )
  );

  const dropzone = screen.getByRole('button', {
    name: 'Select File Accepted file formats: *.geojson, *.gpx, *.json, *.kml, *.kmz, *.zip Maximum file size: 10 MB',
  });

  const file = new File([GEOJSON], 'test.json', { type: 'application/json' });
  const data = {
    dataTransfer: {
      files: [file],
      items: [
        {
          kind: 'file',
          type: file.type,
          getAsFile: () => file,
        },
      ],
      types: ['Files'],
    },
  };
  await act(async () => fireEvent.drop(dropzone, data));
  expect(
    await screen.findByRole('button', {
      name: 'Select File Accepted file formats: *.geojson, *.gpx, *.json, *.kml, *.kmz, *.zip Maximum file size: 10 MB test.json 804 B',
    })
  ).toBeInTheDocument();
});
test('LandscapeBoundaries: Show back', async () => {
  const navigate = jest.fn();
  useNavigate.mockReturnValue(navigate);
  terrasoApi.requestGraphQL.mockReturnValue(
    Promise.resolve({
      landscapes: {
        edges: [
          {
            node: {
              name: 'Landscape Name',
              description: 'Landscape Description',
              website: 'https://www.landscape.org',
            },
          },
        ],
      },
    })
  );
  await setup();

  await act(async () =>
    fireEvent.click(
      screen.getByRole('button', {
        name: 'Upload a map file. Accepted file formats: GeoJSON, GPX, JSON, KML, KMZ, ESRI Shapefile',
      })
    )
  );

  expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
  await act(async () =>
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
  );
  expect(screen.getByRole('button', { name: 'Back' })).toBeInTheDocument();
  await act(async () =>
    fireEvent.click(screen.getByRole('button', { name: 'Back' }))
  );
  expect(navigate.mock.calls[0]).toEqual(['/landscapes/slug-1']);
});
test('LandscapeBoundaries: Save GeoJSON', async () => {
  const landscapes = {
    edges: [
      {
        node: {
          id: '1',
          name: 'Landscape Name',
          description: 'Landscape Description',
          website: 'https://www.landscape.org',
        },
      },
    ],
  };
  terrasoApi.requestGraphQL
    .mockResolvedValueOnce({
      landscapes,
    })
    .mockResolvedValueOnce({
      landscapes,
    })
    .mockResolvedValueOnce({
      updateLandscape: {
        landscape: {
          id: '1',
          name: 'Landscape Name',
          description: 'Landscape Description',
          website: 'https://www.landscape.org',
          location: 'Location',
        },
      },
    });
  terrasoApi.request.mockResolvedValueOnce({
    geogeojson: '',
  });
  await setup();

  expect(terrasoApi.requestGraphQL).toHaveBeenCalledTimes(2);

  await act(async () =>
    fireEvent.click(
      screen.getByRole('button', {
        name: 'Upload a map file. Accepted file formats: GeoJSON, GPX, JSON, KML, KMZ, ESRI Shapefile',
      })
    )
  );

  const dropzone = screen.getByRole('button', {
    name: 'Select File Accepted file formats: *.geojson, *.gpx, *.json, *.kml, *.kmz, *.zip Maximum file size: 10 MB',
  });

  const file = new File([GEOJSON], 'test.json', { type: 'application/json' });
  const data = {
    dataTransfer: {
      files: [file],
      items: [
        {
          kind: 'file',
          type: file.type,
          getAsFile: () => file,
        },
      ],
      types: ['Files'],
    },
  };
  await act(async () => fireEvent.drop(dropzone, data));
  expect(
    await screen.findByRole('button', {
      name: 'Select File Accepted file formats: *.geojson, *.gpx, *.json, *.kml, *.kmz, *.zip Maximum file size: 10 MB test.json 804 B',
    })
  ).toBeInTheDocument();

  const saveButton = screen.getByRole('button', {
    name: 'Update',
  });
  expect(saveButton).toBeInTheDocument();
  expect(saveButton).not.toHaveAttribute('disabled');
  await act(async () => fireEvent.click(saveButton));
  expect(terrasoApi.requestGraphQL).toHaveBeenCalledTimes(3);
  const saveCall = terrasoApi.requestGraphQL.mock.calls[2];
  expect(saveCall[1]).toStrictEqual({
    input: {
      id: '1',
      areaPolygon: JSON.stringify(JSON.parse(GEOJSON)),
    },
  });
});

test('LandscapeBoundaries: Save KML', async () => {
  const file = new File([KML], 'valid.kml', {
    type: 'application/vnd.google-earth.kml+xml',
  });

  const landscapes = {
    edges: [
      {
        node: {
          id: '1',
          name: 'Landscape Name',
          description: 'Landscape Description',
          website: 'https://www.landscape.org',
        },
      },
    ],
  };
  terrasoApi.requestGraphQL
    .mockResolvedValueOnce({
      landscapes,
    })
    .mockResolvedValueOnce({
      landscapes,
    })
    .mockResolvedValueOnce({
      updateLandscape: {
        landscape: {
          id: '1',
          name: 'Landscape Name',
          description: 'Landscape Description',
          website: 'https://www.landscape.org',
          location: 'Location',
        },
      },
    });
  const geojson = {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [102.0, 0.5] },
        properties: { prop0: 'value0' },
      },
      {
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: [
            [
              [100.0, 0.0],
              [101.0, 0.0],
              [101.0, 1.0],
              [100.0, 1.0],
              [100.0, 0.0],
            ],
          ],
        },
      },
    ],
  };
  terrasoApi.request.mockResolvedValueOnce({
    geojson,
  });
  await setup();

  expect(terrasoApi.requestGraphQL).toHaveBeenCalledTimes(2);

  await act(async () =>
    fireEvent.click(
      screen.getByRole('button', {
        name: 'Upload a map file. Accepted file formats: GeoJSON, GPX, JSON, KML, KMZ, ESRI Shapefile',
      })
    )
  );

  const dropzone = screen.getByRole('button', {
    name: 'Select File Accepted file formats: *.geojson, *.gpx, *.json, *.kml, *.kmz, *.zip Maximum file size: 10 MB',
  });

  const dataTransfer = {
    dataTransfer: {
      files: [file],
      items: [
        {
          kind: 'file',
          type: file.type,
          getAsFile: () => file,
        },
      ],
      types: ['Files'],
    },
  };
  fireEvent.drop(dropzone, dataTransfer);
  await waitFor(async () => {
    expect(
      screen.getByRole('button', {
        name: 'Select File Accepted file formats: *.geojson, *.gpx, *.json, *.kml, *.kmz, *.zip Maximum file size: 10 MB valid.kml 406 B',
      })
    ).toBeInTheDocument();
  });

  const saveButton = screen.getByRole('button', {
    name: 'Update',
  });
  expect(saveButton).toBeInTheDocument();
  expect(saveButton).not.toHaveAttribute('disabled');
  await act(async () => fireEvent.click(saveButton));
  expect(terrasoApi.requestGraphQL).toHaveBeenCalledTimes(3);
  const saveCall = terrasoApi.requestGraphQL.mock.calls[2];
  expect(saveCall[1]).toStrictEqual({
    input: {
      id: '1',
      areaPolygon: JSON.stringify(geojson),
    },
  });
});
