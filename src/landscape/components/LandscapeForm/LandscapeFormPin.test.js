import { fireEvent, render, screen, waitFor, within } from 'tests/utils';

import React from 'react';

import { act } from 'react-dom/test-utils';
import { useMap } from 'react-leaflet';
import { useParams } from 'react-router-dom';

import LandscapeForm from 'landscape/components/LandscapeForm';
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
  await render(<LandscapeForm />);
  const name = screen.getByRole('textbox', {
    name: 'Name (required)',
  });
  const description = screen.getByRole('textbox', {
    name: 'Description (required)',
  });
  const website = screen.getByRole('textbox', { name: 'Website' });
  const location = screen.getByRole('button', { name: 'Country or region' });

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
  useParams.mockReturnValue({
    slug: 'slug-1',
  });
});

test('LandscapeForm: Save form Pin boundary', async () => {
  terrasoApi.requestGraphQL
    .mockResolvedValueOnce({
      landscapes: {
        edges: [
          {
            node: {
              id: '1',
              name: 'Landscape Name',
              description: 'Landscape Description',
              website: 'www.landscape.org',
              location: 'EC',
            },
          },
        ],
      },
    })
    .mockResolvedValueOnce({
      updateLandscape: {
        landscape: {
          id: '1',
          name: 'Landscape Name',
          description: 'Landscape Description',
          website: 'www.landscape.org',
          location: 'EC',
        },
      },
    });

  const eventCallback = {};
  useMap.mockReturnValue({
    getBounds: () => ({
      getSouthWest: () => ({ lat: 0, lng: 10 }),
      getNorthEast: () => ({ lat: 1, lng: 11 }),
    }),
    fitBounds: () => {},
    addControl: () => {},
    removeControl: () => {},
    on: (event, callback) => {
      eventCallback[event] = callback;
    },
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

  await act(async () =>
    eventCallback['draw:created']({
      layerType: 'marker',
      layer: { getLatLng: () => ({ lat: 10, lng: 10 }) },
    })
  );

  await act(async () =>
    fireEvent.click(screen.getByRole('button', { name: 'Create Landscape' }))
  );

  expect(terrasoApi.requestGraphQL).toHaveBeenCalledTimes(2);
  const saveCall = terrasoApi.requestGraphQL.mock.calls[1];
  expect(saveCall[1]).toStrictEqual({
    input: {
      id: '1',
      description: 'New description',
      name: 'New name',
      website: 'https://www.other.org',
      location: 'AR',
      areaPolygon:
        '{"type":"FeatureCollection","bbox":[10,0,11,1],"features":[{"type":"Feature","properties":{},"geometry":{"type":"Point","coordinates":[10,10]}}]}',
    },
  });
});
