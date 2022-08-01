import { fireEvent, render, screen, waitFor, within } from 'tests/utils';

import React from 'react';

import { act } from 'react-dom/test-utils';
import { useParams } from 'react-router-dom';

import LandscapeNew from 'landscape/components/LandscapeNew';
import * as terrasoApi from 'terrasoBackend/api';

jest.mock('terrasoBackend/api');

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: jest.fn(),
}));

const GEOJSON =
  '{"type": "FeatureCollection", "features": [{"type": "Feature", "geometry": {"type": "Polygon", "coordinates": [[[-80.02098083496094, 0.8184536092473124], [-80.04364013671875, 0.8177670337355836], [-80.04844665527342, 0.8184536092473124], [-80.04981994628906, 0.8260059320976082], [-80.07247924804686, 0.802662342941431], [-80.09170532226562, 0.779318620539376], [-80.10063171386719, 0.7532284249372649], [-80.09857177734375, 0.7223319390984623], [-80.09307861328125, 0.7140928403610857], [-80.10337829589842, 0.6955548144696846], [-80.09788513183594, 0.6742703246919985], [-80.08827209472656, 0.6488661346824502], [-80.07797241210938, 0.6495527361122139], [-80.06561279296875, 0.6522991408974699], [-80.06235122680664, 0.6468063298344634], [-80.02098083496094, 0.8184536092473124]]]}, "properties": {}}]}';

const setup = async () => {
  await render(<LandscapeNew />);
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
  useParams.mockReturnValue({});
});

test('LandscapeNew: Save from GeoJSON', async () => {
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
        name: 'Upload a GeoJSON file',
      })
    )
  );

  const dropzone = screen.getByRole('button', {
    name: 'Select File Accepted file formats: *.json, *.geojson Maximum file size: 1 MB',
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
      name: 'Select File Accepted file formats: *.json, *.geojson Maximum file size: 1 MB test.json 804 B',
    })
  ).toBeInTheDocument();

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
      areaPolygon: JSON.stringify({
        ...JSON.parse(GEOJSON),
        bbox: [
          -80.15625000000001, 1.4061088354351594, -80.15625000000001,
          1.4061088354351594,
        ],
      }),
    },
  });
});
