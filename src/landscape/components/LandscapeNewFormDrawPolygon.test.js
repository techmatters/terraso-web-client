import { fireEvent, render, screen, waitFor, within } from 'tests/utils';

import React from 'react';

import L from 'leaflet';
import { act } from 'react-dom/test-utils';
import * as reactLeaflet from 'react-leaflet';
import { useParams } from 'react-router-dom';

import LandscapeNew from 'landscape/components/LandscapeNew';
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

test('LandscapeNew: Save form draw polygon boundary', async () => {
  terrasoApi.requestGraphQL.mockResolvedValueOnce({
    addLandscape: {
      landscape: {
        id: '1',
        name: 'Landscape Name',
        description: 'Landscape Description',
        website: 'www.landscape.org',
        location: 'EC',
      },
    },
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
    expect(
      screen.getByRole('button', { name: 'Add Landscape' })
    ).toBeInTheDocument();
  });

  await act(async () =>
    fireEvent.click(screen.getByRole('button', { name: 'Add Landscape' }))
  );

  expect(terrasoApi.requestGraphQL).toHaveBeenCalledTimes(1);
  const saveCall = terrasoApi.requestGraphQL.mock.calls[0];
  expect(saveCall[1]).toStrictEqual({
    input: {
      description: 'New description',
      name: 'New name',
      website: 'https://www.other.org',
      location: 'AR',
      areaPolygon:
        '{"type":"FeatureCollection","features":[{"type":"Feature","properties":{},"geometry":{"type":"Polygon","coordinates":[[[-109.05,37],[-109.03,41],[-102.05,41],[-102.04,37],[-109.05,37]]]}}],"bbox":[-105.46875000000001,38.82259097617713,-105.46875000000001,38.82259097617713]}',
    },
  });
});
