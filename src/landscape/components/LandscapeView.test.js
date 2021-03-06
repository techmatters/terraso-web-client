import { act, fireEvent, render, screen, within } from 'tests/utils';

import React from 'react';

import _ from 'lodash/fp';
import { useParams } from 'react-router-dom';

import LandscapeView from 'landscape/components/LandscapeView';
import * as terrasoApi from 'terrasoBackend/api';

jest.mock('terrasoBackend/api');

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: jest.fn(),
}));

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
});

const baseViewTest = async () => {
  global.fetch.mockReturnValue(
    Promise.resolve({
      json: () => [],
    })
  );
  const memberships = {
    totalCount: 6,
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

  const accountMembership = _.set(
    'edges[0].node',
    {
      id: 'user-id',
      userRole: 'MEMBER',
      membershipStatus: 'APPROVED',
    },
    {}
  );

  const dataEntries = {
    edges: Array(6)
      .fill(0)
      .map((item, index) => ({
        node: {
          id: `de-${index}`,
          createdAt: '2022-05-20T16:25:21.536679+00:00',
          name: `Data Entry ${index}`,
          createdBy: { id: 'user-id', firstName: 'First', lastName: 'Last' },
          description: `Description ${index}`,
          size: 3456,
        },
      })),
  };

  terrasoApi.requestGraphQL.mockResolvedValueOnce({
    landscapes: {
      edges: [
        {
          node: {
            name: 'Landscape Name',
            description: 'Landscape Description',
            website: 'www.landscape.org',
            location: 'EC',
            defaultGroup: {
              edges: [
                {
                  node: {
                    group: {
                      slug: 'test-group-slug',
                      memberships,
                      accountMembership,
                    },
                  },
                },
              ],
            },
          },
        },
      ],
    },
  });
  terrasoApi.requestGraphQL.mockResolvedValueOnce({
    groups: {
      edges: [
        {
          node: {
            dataEntries,
          },
        },
      ],
    },
  });
  await setup();

  // Landscape info
  expect(
    screen.getByRole('heading', { name: 'Landscape Name' })
  ).toBeInTheDocument();
  expect(screen.getByText(/Ecuador/i)).toBeInTheDocument();
  expect(screen.getByText(/Landscape Description/i)).toBeInTheDocument();
  expect(
    screen.getByRole('link', { name: 'www.landscape.org' })
  ).toBeInTheDocument();

  // Members
  expect(
    screen.getByText(/6 Terraso members joined Landscape Name./i)
  ).toBeInTheDocument();
  expect(screen.getByText(/\+2/i)).toBeInTheDocument();
  expect(
    screen.getByRole('button', { name: 'Leave Landscape' })
  ).toBeInTheDocument();

  // Map
  expect(screen.getByRole('button', { name: 'Zoom in' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Zoom out' })).toBeInTheDocument();

  // Shared Data
  const sharedDataRegion = within(
    screen.getByRole('region', { name: 'Shared files' })
  );
  expect(
    sharedDataRegion.getByRole('heading', { name: 'Shared files' })
  ).toBeInTheDocument();
  const entriesList = within(sharedDataRegion.getByRole('list'));
  const items = entriesList.getAllByRole('listitem');
  expect(items.length).toBe(6);
};

test('LandscapeView: Display error', async () => {
  terrasoApi.requestGraphQL.mockRejectedValue(['Load error']);
  await setup();
  expect(screen.getByText(/Load error/i)).toBeInTheDocument();
});
test('LandscapeForm: Display loader', async () => {
  terrasoApi.requestGraphQL.mockReturnValue(new Promise(() => {}));
  await setup();
  const loader = screen.getByRole('progressbar', {
    name: 'Loading',
    hidden: true,
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

test('LandscapeView: Display data', baseViewTest);

test('LandscapeView: Update Shared Data', async () => {
  await baseViewTest();

  terrasoApi.requestGraphQL.mockResolvedValueOnce({});
  terrasoApi.requestGraphQL.mockResolvedValueOnce({});

  const sharedDataRegion = within(
    screen.getByRole('region', { name: 'Shared files' })
  );
  const entriesList = within(sharedDataRegion.getByRole('list'));
  const items = entriesList.getAllByRole('listitem');

  const nameField = within(items[3]).getByRole('button', {
    name: 'Data Entry 3',
  });
  expect(nameField).toBeInTheDocument();
  await act(async () => fireEvent.click(nameField));
  const name = within(items[3]).getByRole('textbox', {
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
  const saveCall = terrasoApi.requestGraphQL.mock.calls[2];

  expect(saveCall[1].input).toEqual({
    id: 'de-3',
    name: 'Data Entry 3 updated',
    description: 'Description 3',
  });
});

test('LandscapeView: Refresh profile', async () => {
  await baseViewTest();

  terrasoApi.requestGraphQL.mockResolvedValueOnce({});
  terrasoApi.requestGraphQL.mockReturnValueOnce(new Promise(() => {}));

  await act(async () =>
    fireEvent.click(screen.getByRole('button', { name: 'Leave Landscape' }))
  );

  const dialog = screen.getByRole('dialog', { name: 'Leave ???Landscape Name???' });

  await act(async () =>
    fireEvent.click(
      within(dialog).getByRole('button', { name: 'Leave Landscape' })
    )
  );

  const loader = screen.getByRole('progressbar', {
    name: 'Refreshing',
    hidden: true,
  });
  expect(loader).toBeInTheDocument();
});
