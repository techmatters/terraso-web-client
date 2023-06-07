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
import L from 'leaflet';
import { act } from 'react-dom/test-utils';
import * as reactLeaflet from 'react-leaflet';
import { useParams } from 'react-router-dom';
import * as terrasoApi from 'terrasoApi/shared/terrasoApi/api';
import LandscapeNew from 'landscape/components/LandscapeForm/New';

jest.mock('terrasoApi/shared/terrasoApi/api');

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: jest.fn(),
}));

jest.mock('react-leaflet', () => ({
  ...jest.requireActual('react-leaflet'),
  useMap: jest.fn(),
}));

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
  const location = screen.getByRole('button', {
    name: 'Country or region (required) Landscape location',
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
  reactLeaflet.useMap.mockImplementation(
    jest.requireActual('react-leaflet').useMap
  );
});

test('LandscapeNew: Save form draw polygon boundary', async () => {
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

  const spy = jest.spyOn(reactLeaflet, 'useMap');

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

  await waitFor(() => expect(spy).toHaveBeenCalled());
  const map = spy.mock.results[spy.mock.results.length - 1].value;

  await act(async () =>
    map.fireEvent('draw:created', {
      layerType: 'polygon',
      layer: new L.polygon([
        [37, -109.05],
        [41, -109.03],
        [41, -102.05],
        [37, -102.04],
      ]),
    })
  );
  await act(async () =>
    fireEvent.click(screen.getByRole('button', { name: 'close' }))
  );

  await waitFor(() => {
    expect(screen.getByRole('button', { name: 'Next' })).toBeInTheDocument();
  });
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
      areaPolygon:
        '{"type":"FeatureCollection","features":[{"type":"Feature","properties":{},"geometry":{"type":"Polygon","coordinates":[[[-109.05,37],[-109.03,41],[-102.05,41],[-102.04,37],[-109.05,37]]]}}],"bbox":[-105.46875000000001,38.82259097617713,-105.46875000000001,38.82259097617713]}',
      areaTypes: null,
      population: null,
      partnershipStatus: 'no',
    },
  });
});
