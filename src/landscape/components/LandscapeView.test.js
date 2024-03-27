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
import { when } from 'jest-when';
import _ from 'lodash/fp';
import { useParams } from 'react-router-dom';
import * as terrasoApi from 'terraso-client-shared/terrasoApi/api';

import mapboxgl from 'gis/mapbox';
import LandscapeView from 'landscape/components/LandscapeView';

const GEOJSON =
  '{"type": "FeatureCollection", "features": [{"type": "Feature", "geometry": {"type": "Polygon", "coordinates": [[[-80.02098083496094, 0.8184536092473124], [-80.04364013671875, 0.8177670337355836], [-80.04844665527342, 0.8184536092473124], [-80.04981994628906, 0.8260059320976082], [-80.07247924804686, 0.802662342941431], [-80.09170532226562, 0.779318620539376], [-80.10063171386719, 0.7532284249372649], [-80.09857177734375, 0.7223319390984623], [-80.09307861328125, 0.7140928403610857], [-80.10337829589842, 0.6955548144696846], [-80.09788513183594, 0.6742703246919985], [-80.08827209472656, 0.6488661346824502], [-80.07797241210938, 0.6495527361122139], [-80.06561279296875, 0.6522991408974699], [-80.06235122680664, 0.6468063298344634], [-80.02098083496094, 0.8184536092473124]]]}, "properties": {}}]}';

jest.mock('terraso-client-shared/terrasoApi/api');

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: jest.fn(),
}));

jest.mock('gis/mapbox', () => ({}));

global.fetch = jest.fn();

const setup = async () => {
  await render(<LandscapeView />, {
    account: {
      hasToken: true,
      currentUser: {
        fetching: false,
        data: {
          id: 'user-id',
          email: 'email@email.com',
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
  global.URL.createObjectURL = jest.fn();
  mapboxgl.LngLatBounds = jest.fn();
  mapboxgl.NavigationControl = jest.fn();
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
    off: jest.fn(),
  };
});

const baseViewTest = async (
  accountMembership = {
    id: 'account-membership-id',
    userRole: 'member',
    membershipStatus: 'APPROVED',
  }
) => {
  global.fetch.mockReturnValue(
    Promise.resolve({
      json: () => [],
    })
  );
  const memberships = {
    edges: Array(5)
      .fill(0)
      .map(() => ({
        node: {
          user: {
            firstName: 'Member name',
            lastName: 'Member Last Name',
          },
        },
      })),
  };

  const sharedResources = {
    edges: Array(6)
      .fill(0)
      .map((item, index) => ({
        node: {
          id: `sr-${index}`,
          source: {
            id: `de-${index}`,
            createdAt: '2022-05-20T16:25:21.536679+00:00',
            name: `Data Entry ${index}`,
            createdBy: { id: 'user-id', firstName: 'First', lastName: 'Last' },
            description: `Description ${index}`,
            size: 3456,
            entryType: 'FILE',
            resourceType: 'txt',
            visualizations: { edges: [] },
          },
        },
      })),
  };

  when(terrasoApi.requestGraphQL)
    .calledWith(
      expect.stringContaining('query landscapesToView'),
      expect.anything()
    )
    .mockResolvedValue({
      landscapes: {
        edges: [
          {
            node: {
              name: 'Landscape Name',
              description: 'Landscape Description',
              website: 'https://www.landscape.org',
              location: 'EC',
              areaPolygon: GEOJSON,
              membershipList: {
                memberships,
                accountMembership,
                membershipsCount: 6,
              },
              sharedResources,
            },
          },
        ],
      },
    });
  await setup();
};

test('LandscapeView: Display error', async () => {
  terrasoApi.requestGraphQL.mockRejectedValue(['Load error']);
  await setup();
  expect(screen.getByText(/Load error/i)).toBeInTheDocument();
});
test('LandscapeView: Display loader', async () => {
  terrasoApi.requestGraphQL.mockReturnValue(new Promise(() => {}));
  await setup();
  const loader = screen.getByRole('progressbar', {
    name: 'Loading',
  });
  expect(loader).toBeInTheDocument();
});
test('LandscapeView: Not found', async () => {
  global.fetch.mockReturnValue(
    Promise.resolve({
      json: () => [],
    })
  );
  terrasoApi.requestGraphQL.mockReturnValue(
    Promise.resolve({
      landscape: null,
    })
  );
  await setup();
  expect(screen.getByText(/Landscape not found/i)).toBeInTheDocument();
});

test('LandscapeView: Display data', async () => {
  await baseViewTest();

  // Landscape info
  expect(
    screen.getByRole('heading', { name: 'Landscape Name' })
  ).toBeInTheDocument();
  expect(screen.getByText(/Ecuador/i)).toBeInTheDocument();
  expect(screen.getByText(/Landscape Description/i)).toBeInTheDocument();
  expect(
    screen.getByRole('link', { name: 'https://www.landscape.org' })
  ).toBeInTheDocument();

  // Members
  const membersSection = screen.getByRole('region', { name: 'Members' });
  expect(
    within(membersSection).getByText(
      /6 Terraso members joined Landscape Name./i
    )
  ).toBeInTheDocument();
  expect(screen.getByText(/\+2/i)).toBeInTheDocument();

  // Shared Data
  const sharedDataRegion = within(
    screen.getByRole('region', { name: 'Shared files and Links' })
  );
  expect(
    sharedDataRegion.getByRole('heading', { name: 'Shared files and Links' })
  ).toBeInTheDocument();
  const entriesList = within(sharedDataRegion.getByRole('list'));
  const items = entriesList.getAllByRole('listitem');
  expect(items.length).toBe(6);
  const firstEntry = within(items[0]);
  expect(firstEntry.getByText('Data Entry 0')).toBeInTheDocument();
  expect(firstEntry.getByText('txt')).toBeInTheDocument();

  // Boundary
  expect(
    screen.getByRole('region', { name: 'Landscape map' })
  ).toBeInTheDocument();
  expect(
    screen.getByRole('button', { name: 'Download boundary (GeoJSON)' })
  ).toBeInTheDocument();

  expect(
    screen.getByRole('button', { name: 'Leave: Landscape Name' })
  ).toBeInTheDocument();
  expect(screen.getByText('Something wrong with the map?')).toBeInTheDocument();
});

test('LandscapeView: Managers do not see warning', async () => {
  await baseViewTest({
    id: 'account-membership-id',
    userRole: 'manager',
    membershipStatus: 'APPROVED',
  });

  expect(
    screen.queryByText('Something wrong with the map?')
  ).not.toBeInTheDocument();
});

test('LandscapeView: Update Shared Data', async () => {
  await baseViewTest();

  when(terrasoApi.requestGraphQL)
    .calledWith(
      expect.stringContaining('mutation updateSharedData'),
      expect.objectContaining({
        input: {
          id: `de-3`,
          name: 'Data Entry 3 updated',
          description: 'Description 3',
        },
      })
    )
    .mockResolvedValueOnce(
      _.set(
        'updateDataEntry.dataEntry',
        {
          id: `de-3`,
          createdAt: '2022-05-20T16:25:21.536679+00:00',
          name: `Data Entry 3 updated`,
          description: 'Description 3',
          createdBy: { id: 'user-id', firstName: 'First', lastName: 'Last' },
          size: 3456,
          entryType: 'FILE',
        },
        {}
      )
    );
  when(terrasoApi.requestGraphQL)
    .calledWith(
      expect.stringContaining('mutation updateSharedData'),
      expect.objectContaining({
        input: {
          id: 'de-3',
          name: 'Data Entry 3 revised',
          description: 'Description 3',
        },
      })
    )
    .mockResolvedValueOnce(
      _.set(
        'updateDataEntry.dataEntry',
        {
          id: `de-3`,
          createdAt: '2022-05-20T16:25:21.536679+00:00',
          name: `Data Entry 3 revised`,
          description: 'Description 3',
          createdBy: { id: 'user-id', firstName: 'First', lastName: 'Last' },
          size: 3456,
          entryType: 'FILE',
        },
        {}
      )
    );

  const sharedDataRegion = within(
    screen.getByRole('region', { name: 'Shared files and Links' })
  );
  const entriesList = within(sharedDataRegion.getByRole('list'));
  const items = entriesList.getAllByRole('listitem');

  let nameField = within(items[3]).getByRole('button', {
    name: 'Data Entry 3',
  });
  expect(nameField).toBeInTheDocument();
  await act(async () => fireEvent.click(nameField));

  await waitFor(() =>
    expect(
      within(items[3]).getByRole('textbox', {
        name: 'Update name',
      })
    ).toBeInTheDocument()
  );

  let name = within(items[3]).getByRole('textbox', {
    name: 'Update name',
  });
  fireEvent.change(name, { target: { value: 'Data Entry 3 updated' } });
  await act(async () =>
    fireEvent.click(
      within(items[3]).getByRole('button', {
        name: 'Save',
      })
    )
  );

  expect(terrasoApi.requestGraphQL).toHaveBeenCalledWith(
    expect.stringContaining('mutation updateSharedData'),
    {
      input: {
        id: 'de-3',
        name: 'Data Entry 3 updated',
        description: 'Description 3',
      },
    }
  );

  // Rename a second time to ensure state is reset
  nameField = within(items[3]).getByRole('button', {
    name: 'Data Entry 3 updated',
  });
  expect(nameField).toBeInTheDocument();
  await act(async () => fireEvent.click(nameField));

  await waitFor(() =>
    expect(
      within(items[3]).getByRole('textbox', {
        name: 'Update name',
      })
    ).toBeInTheDocument()
  );

  name = within(items[3]).getByRole('textbox', {
    name: 'Update name',
  });
  fireEvent.change(name, { target: { value: 'Data Entry 3 revised' } });
  await act(async () =>
    fireEvent.click(
      within(items[3]).getByRole('button', {
        name: 'Save',
      })
    )
  );
  expect(terrasoApi.requestGraphQL).toHaveBeenCalledWith(
    expect.stringContaining('mutation updateSharedData'),
    {
      input: {
        id: 'de-3',
        name: 'Data Entry 3 revised',
        description: 'Description 3',
      },
    }
  );
});

test('LandscapeView: Refresh profile on leave', async () => {
  await baseViewTest();

  terrasoApi.requestGraphQL.mockResolvedValueOnce({
    deleteLandscapeMembership: {
      landscape: {},
    },
  });

  expect(
    screen.getByRole('region', { name: 'Shared files and Links' })
  ).toBeInTheDocument();

  await act(async () =>
    fireEvent.click(
      screen.getByRole('button', { name: 'Leave: Landscape Name' })
    )
  );

  const dialog = screen.getByRole('dialog', { name: 'Leave “Landscape Name”' });

  await act(async () =>
    fireEvent.click(
      within(dialog).getByRole('button', { name: 'Leave Landscape' })
    )
  );

  const leaveCall = terrasoApi.requestGraphQL.mock.calls[2];
  expect(leaveCall[1].input).toEqual({
    id: 'account-membership-id',
    landscapeSlug: 'slug-1',
  });

  expect(
    screen.queryByRole('region', { name: 'Shared files and Links' })
  ).not.toBeInTheDocument();
});

test('LandscapeView: Refresh profile on join', async () => {
  await baseViewTest({});

  terrasoApi.requestGraphQL.mockResolvedValueOnce({
    saveLandscapeMembership: {
      landscape: {
        membershipList: {
          accountMembership: {
            id: 'account-membership-id',
            userRole: 'member',
            membershipStatus: 'APPROVED',
          },
          membershipsCount: 6,
        },
      },
    },
  });

  expect(
    screen.queryByRole('region', { name: 'Shared files and Links' })
  ).not.toBeInTheDocument();

  await act(async () =>
    fireEvent.click(screen.getByRole('button', { name: 'Join Landscape' }))
  );

  const joinCall = terrasoApi.requestGraphQL.mock.calls[2];
  expect(joinCall[1].input).toEqual({
    landscapeSlug: 'slug-1',
    userEmails: ['email@email.com'],
    userRole: 'member',
  });

  expect(
    screen.getByRole('region', { name: 'Shared files and Links' })
  ).toBeInTheDocument();
});
