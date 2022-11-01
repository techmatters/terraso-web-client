import { fireEvent, render, screen, waitFor, within } from 'tests/utils';

import React from 'react';

import L from 'leaflet';
import { act } from 'react-dom/test-utils';
import * as reactLeaflet from 'react-leaflet';
import { useParams } from 'react-router-dom';

import LandscapeNew from 'landscape/components/LandscapeForm/New';
import * as terrasoApi from 'terrasoBackend/api';

jest.mock('terrasoBackend/api');

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: jest.fn(),
}));

jest.mock('react-leaflet', () => ({
  ...jest.requireActual('react-leaflet'),
  useMap: jest.fn(),
}));

const setup = async () => {
  await render(<LandscapeNew />);
  const name = screen.getByRole('textbox', {
    name: 'Name (required)',
  });
  const description = screen.getByRole('textbox', {
    name: 'Description (required)',
  });
  const website = screen.getByRole('textbox', { name: 'Website' });
  const location = screen.getByRole('button', {
    name: 'Country or region Landscape location',
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

test('LandscapeNew: Save form Pin boundary', async () => {
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
    fireEvent.click(screen.getByRole('button', { name: 'Next' }))
  );
  await waitFor(() => {
    expect(
      screen.getByRole('button', { name: 'Skip this step for now' })
    ).toBeInTheDocument();
  });
  await act(async () =>
    fireEvent.click(
      screen.getByRole('button', {
        name: 'Drop a pin on a map',
      })
    )
  );

  expect(spy).toHaveBeenCalled();
  const map = spy.mock.results[spy.mock.results.length - 1].value;
  await act(async () =>
    map.fireEvent('draw:created', {
      layerType: 'marker',
      layer: new L.Marker([10, 10]),
    })
  );

  await act(async () =>
    fireEvent.click(screen.getByRole('button', { name: 'Next' }))
  );
  await act(async () =>
    fireEvent.click(screen.getByRole('button', { name: 'Save For Now' }))
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
        '{"type":"FeatureCollection","features":[{"type":"Feature","properties":{},"geometry":{"type":"Point","coordinates":[10,10]}}],"bbox":[0,0,0,0]}',
      areaTypes: null,
      population: null,
    },
  });
});
