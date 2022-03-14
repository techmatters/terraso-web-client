import React from 'react';
import { act } from 'react-dom/test-utils';
import { useParams, useNavigate } from 'react-router-dom';

import { render, screen, fireEvent, waitFor } from 'tests/utils';
import LandscapeBoundaries from 'landscape/components/LandscapeBoundaries';
import * as terrasoApi from 'terrasoBackend/api';

jest.mock('terrasoBackend/api');

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: jest.fn(),
  useNavigate: jest.fn(),
}));

const GEOJSON =
  '{"type": "FeatureCollection", "features": [{"type": "Feature", "geometry": {"type": "Polygon", "coordinates": [[[-80.02098083496094, 0.8184536092473124], [-80.04364013671875, 0.8177670337355836], [-80.04844665527342, 0.8184536092473124], [-80.04981994628906, 0.8260059320976082], [-80.07247924804686, 0.802662342941431], [-80.09170532226562, 0.779318620539376], [-80.10063171386719, 0.7532284249372649], [-80.09857177734375, 0.7223319390984623], [-80.09307861328125, 0.7140928403610857], [-80.10337829589842, 0.6955548144696846], [-80.09788513183594, 0.6742703246919985], [-80.08827209472656, 0.6488661346824502], [-80.07797241210938, 0.6495527361122139], [-80.06561279296875, 0.6522991408974699], [-80.06235122680664, 0.6468063298344634], [-80.02098083496094, 0.8184536092473124]]]}, "properties": {}}]}';

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

beforeEach(() => {
  useParams.mockReturnValue({
    slug: 'slug-1',
  });
  useNavigate.mockReturnValue(() => {});
});

test('LandscapeBoundaries: Display error', async () => {
  terrasoApi.request.mockRejectedValue(['Load error']);
  await setup();
  expect(screen.getByText(/Load error/i)).toBeInTheDocument();
});
test('LandscapeBoundaries: Display loader', async () => {
  terrasoApi.request.mockReturnValue(new Promise(() => {}));
  await setup();
  const loader = screen.getByRole('progressbar', {
    name: 'Loading',
    hidden: true,
  });
  expect(loader).toBeInTheDocument();
});
test('LandscapeBoundaries: Select file (Invalid)', async () => {
  global.console.error = jest.fn();
  terrasoApi.request.mockReturnValue(
    Promise.resolve({
      landscapes: {
        edges: [
          {
            node: {
              name: 'Landscape Name',
              description: 'Landscape Description',
              website: 'www.landscape.org',
            },
          },
        ],
      },
    })
  );
  await setup();

  expect(terrasoApi.request).toHaveBeenCalledTimes(1);

  const dropzone = screen.getByRole('button', {
    name: 'Select File Acceptable file formats: *.json, *.geojson File size limit: 1MB',
  });

  const file = new File(['{"key": "value"}'], 'test.json', {
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
  fireEvent.drop(dropzone, data);
  await waitFor(() =>
    expect(
      screen.getByText('Incorrect file format. Please upload a GeoJSON file.')
    ).toBeInTheDocument()
  );
});
test('LandscapeBoundaries: Select file', async () => {
  terrasoApi.request.mockReturnValue(
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

  expect(terrasoApi.request).toHaveBeenCalledTimes(1);

  const dropzone = screen.getByRole('button', {
    name: 'Select File Acceptable file formats: *.json, *.geojson File size limit: 1MB',
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
  fireEvent.drop(dropzone, data);
  await waitFor(() =>
    expect(
      screen.getByRole('button', {
        name: 'Select File Acceptable file formats: *.json, *.geojson File size limit: 1MB test.json 0.8KB',
      })
    ).toBeInTheDocument()
  );
});
test('LandscapeBoundaries: Show cancel', async () => {
  const navigate = jest.fn();
  useNavigate.mockReturnValue(navigate);
  terrasoApi.request.mockReturnValue(
    Promise.resolve({
      landscapes: {
        edges: [
          {
            node: {
              name: 'Landscape Name',
              description: 'Landscape Description',
              website: 'www.landscape.org',
            },
          },
        ],
      },
    })
  );
  await setup();

  const cancelButton = screen.getByRole('button', { name: 'Cancel' });
  expect(cancelButton).toBeInTheDocument();
  await act(async () => fireEvent.click(cancelButton));
  expect(navigate.mock.calls[0]).toEqual(['/landscapes/slug-1']);
});
test('LandscapeBoundaries: Save', async () => {
  terrasoApi.request
    .mockReturnValueOnce(
      Promise.resolve({
        landscapes: {
          edges: [
            {
              node: {
                id: '1',
                name: 'Landscape Name',
                description: 'Landscape Description',
                website: 'www.landscape.org',
              },
            },
          ],
        },
      })
    )
    .mockResolvedValueOnce({
      updateLandscape: {
        landscape: {
          id: '1',
          name: 'Landscape Name',
          description: 'Landscape Description',
          website: 'www.landscape.org',
          location: 'Location',
        },
      },
    });
  await setup();

  expect(terrasoApi.request).toHaveBeenCalledTimes(1);

  const dropzone = screen.getByRole('button', {
    name: 'Select File Acceptable file formats: *.json, *.geojson File size limit: 1MB',
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
  fireEvent.drop(dropzone, data);
  await waitFor(() =>
    expect(screen.getByRole('button', { name: 'Update Geographic Info' })).not.toHaveAttribute('disabled')
  );
  const saveButton = screen.getByRole('button', { name: 'Update Geographic Info' });
  expect(saveButton).toBeInTheDocument();
  expect(saveButton).not.toHaveAttribute('disabled');
  await act(async () => fireEvent.click(saveButton));
  expect(terrasoApi.request).toHaveBeenCalledTimes(2);
  const saveCall = terrasoApi.request.mock.calls[1];
  expect(saveCall[1]).toStrictEqual({
    input: {
      id: '1',
      areaPolygon: JSON.stringify(JSON.parse(GEOJSON)),
    },
  });
});
