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
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import { act } from 'react';
import { useParams } from 'react-router-dom';
import * as terrasoApi from 'terraso-client-shared/terrasoApi/api';

import mapboxgl from 'gis/mapbox';
import LandscapeNew from 'landscape/components/LandscapeForm/New';

jest.mock('terraso-client-shared/terrasoApi/api');

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: jest.fn(),
}));

jest.mock('gis/mapbox', () => ({}));
jest.mock('@mapbox/mapbox-gl-draw');

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
  MapboxDraw.mockClear();
});

test('LandscapeNew: Save form draw polygon boundary', async () => {
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
  const geoJson = {
    type: 'FeatureCollection',
    features: [
      {
        id: 'ec06341d66d12c805160c35e5aae5b9e',
        type: 'Feature',
        properties: {},
        geometry: {
          coordinates: [
            [
              [37, -109.05],
              [41, -109.03],
              [41, -102.05],
              [37, -102.04],
            ],
          ],
          type: 'Polygon',
        },
      },
    ],
  };
  MapboxDraw.mockImplementation(() => ({
    getAll: jest.fn().mockReturnValue(geoJson),
    deleteAll: jest.fn(),
    set: jest.fn(),
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
        name: 'Draw the landscape’s boundary on a map',
      })
    )
  );

  await act(async () =>
    events['draw.create']({
      features: geoJson.features,
    })
  );

  await waitFor(() => {
    expect(screen.getByRole('button', { name: 'Next' })).toBeInTheDocument();
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
        type: 'FeatureCollection',
        features: [
          {
            id: 'ec06341d66d12c805160c35e5aae5b9e',
            type: 'Feature',
            properties: {},
            geometry: {
              coordinates: [
                [
                  [37, -109.05],
                  [41, -109.03],
                  [41, -102.05],
                  [37, -102.04],
                ],
              ],
              type: 'Polygon',
            },
          },
        ],
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
