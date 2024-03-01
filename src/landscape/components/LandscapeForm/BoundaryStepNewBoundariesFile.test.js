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
import { fireEvent, render, screen, waitFor, within } from 'tests/utils';
import React from 'react';
import { act } from 'react-dom/test-utils';
import { useParams } from 'react-router-dom';
import * as terrasoApi from 'terraso-client-shared/terrasoApi/api';

import mapboxgl from 'gis/mapbox';
import LandscapeNew from 'landscape/components/LandscapeForm/New';

jest.mock('custom-hooks', () => {
  return {
    useIsMounted: () => {
      return { current: false };
    },
  };
});

jest.mock('terraso-client-shared/terrasoApi/api');

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: jest.fn(),
}));

jest.mock('gis/mapbox', () => ({}));

const GEOJSON_STRING =
  '{"type": "FeatureCollection", "features": [{"type": "Feature", "geometry": {"type": "Polygon", "coordinates": [[[-80.02098083496094, 0.8184536092473124], [-80.04364013671875, 0.8177670337355836], [-80.04844665527342, 0.8184536092473124], [-80.04981994628906, 0.8260059320976082], [-80.07247924804686, 0.802662342941431], [-80.09170532226562, 0.779318620539376], [-80.10063171386719, 0.7532284249372649], [-80.09857177734375, 0.7223319390984623], [-80.09307861328125, 0.7140928403610857], [-80.10337829589842, 0.6955548144696846], [-80.09788513183594, 0.6742703246919985], [-80.08827209472656, 0.6488661346824502], [-80.07797241210938, 0.6495527361122139], [-80.06561279296875, 0.6522991408974699], [-80.06235122680664, 0.6468063298344634], [-80.02098083496094, 0.8184536092473124]]]}, "properties": {}}]}';

const GEOJSON = JSON.parse(GEOJSON_STRING);

const setup = async () => {
  await render(<LandscapeNew />, {
    account: {
      currentUser: {
        data: {
          email: 'email@account.org',
        },
      },
    },
  });
  const name = screen.getByRole('textbox', {
    name: 'Name (required)',
  });
  const description = screen.getByRole('textbox', {
    name: 'Description (required)',
  });
  const website = screen.getByRole('textbox', { name: 'Website' });
  const location = screen.getByRole('combobox', {
    name: 'Country or region (required)',
  });

  const changeLocation = async newLocation => {
    await act(async () => fireEvent.mouseDown(location));
    const listbox = within(screen.getByRole('listbox'));
    await act(async () =>
      fireEvent.click(listbox.getByRole('option', { name: newLocation }))
    );
  };

  return {
    inputs: {
      name,
      description,
      website,
      location,
      changeLocation,
    },
  };
};

beforeEach(() => {
  useParams.mockReturnValue({});
  mapboxgl.Map = jest.fn();
  mapboxgl.NavigationControl = jest.fn();
  mapboxgl.LngLatBounds = jest.fn();
});

test('LandscapeNew: Save from GeoJSON', async () => {
  const events = {};
  mapboxgl.Map.mockImplementation(() => ({
    on: jest.fn().mockImplementation((...args) => {
      const event = args[0];
      const callback = args.length === 2 ? args[1] : args[2];
      const layer = args.length === 2 ? null : args[1];
      events[[event, layer].filter(p => p).join(':')] = callback;

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
    off: jest.fn(),
    getBounds: jest.fn().mockReturnValue({
      getSouthWest: jest.fn().mockReturnValue({
        lng: -76.29042998100137,
        lat: 8.263885173441716,
      }),
      getNorthEast: jest.fn().mockReturnValue({
        lng: -67.62077603784013,
        lat: 11.325606896067784,
      }),
    }),
  }));
  terrasoApi.requestGraphQL.mockImplementation(query => {
    const trimmedQuery = query.trim();

    if (trimmedQuery.startsWith('query taxonomyTerms')) {
      return Promise.resolve({
        taxonomyTerms: {
          edges: [],
        },
      });
    }
    if (trimmedQuery.startsWith('query groups')) {
      return Promise.resolve({
        independentGroups: {
          edges: [],
        },
        landscapeGroups: {
          edges: [],
        },
      });
    }
    if (trimmedQuery.startsWith('mutation addLandscape')) {
      return Promise.resolve({
        addLandscape: {
          landscape: {
            name: 'New name',
            description: 'New description',
            email: 'info@other.org',
            website: 'https://www.other.org',
            location: 'AR',
            partnershipStatus: 'NO',
          },
        },
      });
    }
    if (trimmedQuery.startsWith('mutation updateLandscape')) {
      return Promise.resolve({
        updateLandscape: {
          landscape: {
            name: 'New name',
            description: 'New description',
            website: 'https://www.other.org',
            location: 'AR',
            partnershipStatus: 'NO',
          },
        },
      });
    }
  });

  const { inputs } = await setup();

  fireEvent.change(inputs.name, { target: { value: 'New name' } });
  fireEvent.change(inputs.description, {
    target: { value: 'New description' },
  });
  fireEvent.change(inputs.website, {
    target: { value: 'https://www.other.org' },
  });
  await inputs.changeLocation('Argentina');

  await act(async () =>
    fireEvent.click(screen.getByRole('button', { name: 'Add Landscape' }))
  );
  await waitFor(() => {
    expect(
      screen.getByRole('button', { name: 'Skip this step for now' })
    ).toBeInTheDocument();
  });
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

  const file = new File([GEOJSON_STRING], 'test.json', {
    type: 'application/json',
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
  await act(async () => fireEvent.drop(dropzone, data));

  await waitFor(async () => {
    expect(
      await screen.findByRole('button', {
        name: 'Select File Accepted file formats: *.geojson, *.gpx, *.json, *.kml, *.kmz, *.zip Maximum file size: 10 MB test.json 804 B',
      })
    ).toBeInTheDocument();
  });

  await act(async () => events['moveend']());

  await act(async () =>
    fireEvent.click(screen.getByRole('button', { name: 'Next' }))
  );
  await act(async () =>
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))
  );

  expect(terrasoApi.requestGraphQL).toHaveBeenCalledTimes(6);
  const saveCall = terrasoApi.requestGraphQL.mock.calls[5];
  expect(saveCall[1]).toStrictEqual({
    input: {
      description: 'New description',
      name: 'New name',
      email: 'info@other.org',
      website: 'https://www.other.org',
      location: 'AR',
      areaPolygon: JSON.stringify({
        ...GEOJSON,
        bbox: [
          -76.29042998100137, 8.263885173441716, -67.62077603784013,
          11.325606896067784,
        ],
      }),
      areaTypes: null,
      population: null,
      partnershipStatus: 'no',
    },
  });
});
