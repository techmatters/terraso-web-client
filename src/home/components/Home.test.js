import { render, screen, within } from 'tests/utils';

import React from 'react';

import _ from 'lodash/fp';

import Home from 'home/components/Home';
import { fetchHomeData } from 'home/homeService';
import * as terrasoApi from 'terrasoBackend/api';

jest.mock('terrasoBackend/api');

jest.mock('home/homeService', () => ({
  ...jest.requireActual('home/homeService'),
  fetchHomeData: jest.fn(),
}));

const setup = async () => {
  await render(<Home />, {
    account: {
      hasToken: true,
      currentUser: {
        fetching: false,
        data: {
          firstName: 'First',
          lastName: 'Last',
        },
      },
    },
  });
};

beforeEach(() => {
  fetchHomeData.mockImplementation(
    jest.requireActual('home/homeService').fetchHomeData
  );
});

test('Home: Display error', async () => {
  terrasoApi.requestGraphQL.mockRejectedValue('Load error');
  await setup();
  expect(
    screen.getByText(/Error loading data. Load error/i)
  ).toBeInTheDocument();
});
test('Home: Display loader', async () => {
  terrasoApi.requestGraphQL.mockReturnValue(new Promise(() => {}));
  await setup();
  const loaders = screen.getAllByRole('progressbar', {
    name: 'Loading',
  });
  expect(loaders.length).toBe(2);
  loaders.forEach(role => expect(role).toBeInTheDocument());
});
test('Home: Display landscapes', async () => {
  terrasoApi.requestGraphQL.mockReturnValue(
    Promise.resolve({
      groups: {
        edges: [],
      },
      landscapeGroups: {
        edges: [
          {
            node: {
              associatedLandscapes: {
                edges: [
                  {
                    node: {
                      landscape: {
                        id: 'id-1',
                        slug: 'id-1',
                        name: 'Landscape 1',
                        defaultGroup: _.set(
                          'edges[0].node.group.accountMembership.edges[0].node.userRole',
                          'MEMBER',
                          {}
                        ),
                      },
                    },
                  },
                  {
                    node: {
                      landscape: {
                        id: 'id-2',
                        slug: 'id-2',
                        name: 'Landscape 2',
                        defaultGroup: _.set(
                          'edges[0].node.group.accountMembership.edges[0].node.userRole',
                          'MANAGER',
                          {}
                        ),
                      },
                    },
                  },
                ],
              },
            },
          },
        ],
      },
    })
  );
  await setup();
  expect(screen.getByText(/Landscape 1/i)).toBeInTheDocument();
  expect(screen.getByText(/Member/i)).toBeInTheDocument();
  expect(screen.getByText(/Landscape 2/i)).toBeInTheDocument();
  expect(screen.getByText(/Manager/i)).toBeInTheDocument();
});
test('Home: Display groups', async () => {
  terrasoApi.requestGraphQL.mockReturnValue(
    Promise.resolve({
      userIndependentGroups: {
        edges: [
          {
            node: {
              id: 'id-1',
              slug: 'id-1',
              name: 'Group 1',
              accountMembership: _.set(
                'edges[0].node',
                { userRole: 'MEMBER', membershipStatus: 'APPROVED' },
                {}
              ),
            },
          },
        ],
      },
      userLandscapeGroups: {
        edges: [
          {
            node: {
              id: 'id-2',
              slug: 'id-2',
              name: 'Group 2',
              accountMembership: _.set(
                'edges[0].node',
                { userRole: 'MANAGER', membershipStatus: 'APPROVED' },
                {}
              ),
              pending: { totalCount: 1 },
            },
          },
          {
            node: {
              id: 'id-3',
              slug: 'id-3',
              name: 'Group 3',
              accountMembership: _.set(
                'edges[0].node',
                { userRole: 'MEMBER', membershipStatus: 'PENDING' },
                {}
              ),
              pending: { totalCount: 1 },
            },
          },
        ],
      },
    })
  );
  await setup();

  const list = within(screen.getByRole('region', { name: 'Groups' }));
  const items = list.getAllByRole('listitem');
  expect(items.length).toBe(3);

  expect(within(items[0]).getByText('Group 3')).toBeInTheDocument();
  expect(within(items[0]).getByText('(Pending)')).toBeInTheDocument();
  expect(
    within(items[0]).getByText('Waiting for the group manager’s approval')
  ).toBeInTheDocument();

  expect(within(items[1]).getByText('Group 1')).toBeInTheDocument();
  expect(within(items[1]).getByText('(Member)')).toBeInTheDocument();

  expect(within(items[2]).getByText('Group 2')).toBeInTheDocument();
  expect(within(items[2]).getByText('(Manager)')).toBeInTheDocument();
  expect(within(items[2]).getByText('1 pending member')).toBeInTheDocument();
});
test('Home: Display defaults', async () => {
  fetchHomeData.mockReturnValue(
    Promise.resolve({
      groups: [],
      landscapes: [],
      landscapesDiscovery: [],
    })
  );
  await setup();
  expect(screen.getByText(/EXPLORE LANDSCAPES/i)).toBeInTheDocument();
  expect(screen.getByText(/Groups connect people/i)).toBeInTheDocument();
});
