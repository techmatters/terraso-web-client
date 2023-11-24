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
import { render, screen, within } from 'tests/utils';
import React from 'react';
import _ from 'lodash/fp';
import * as terrasoApi from 'terraso-client-shared/terrasoApi/api';

import Home from 'home/components/Home';
import { fetchHomeData } from 'home/homeService';

jest.mock('terraso-client-shared/terrasoApi/api');

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
  expect(loaders.length).toBe(3);
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
                          'accountMembership.userRole',
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
                          'accountMembership.userRole',
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
              accountMembership: {
                userRole: 'MEMBER',
                membershipStatus: 'APPROVED',
              },
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
              accountMembership: {
                userRole: 'MANAGER',
                membershipStatus: 'APPROVED',
              },

              pending: { totalCount: 1 },
            },
          },
          {
            node: {
              id: 'id-3',
              slug: 'id-3',
              name: 'Group 3',
              accountMembership: {
                userRole: 'MEMBER',
                membershipStatus: 'PENDING',
              },

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
test('Home: Display Story Maps', async () => {
  terrasoApi.requestGraphQL.mockReturnValue(
    Promise.resolve({
      storyMaps: {
        edges: [
          {
            node: {
              id: 'id-1',
              slug: 'id-1',
              storyMapId: '46h36we',
              title: 'Story 1',
              isPublished: false,
              updatedAt: '2023-01-31T22:25:42.916303+00:00',
              createdBy: {
                userId: 'user-1',
                firstName: 'Pablo',
                lastName: 'Perez',
              },
            },
          },
          {
            node: {
              id: 'id-2',
              slug: 'id-2',
              storyMapId: 'lftawa9',
              title: 'Story 2',
              isPublished: true,
              updatedAt: '2023-01-31T22:25:42.916303+00:00',
              createdBy: {
                userId: 'user-2',
                firstName: 'Pedro',
                lastName: 'Paez',
              },
            },
          },
        ],
      },
    })
  );
  await setup();

  const list = within(screen.getByRole('region', { name: 'Story Maps' }));
  const items = list.getAllByRole('listitem');
  expect(items.length).toBe(2);

  const link1 = within(items[0]).getByRole('link', { name: 'Story 2' });
  expect(link1).toHaveAttribute('href', '/tools/story-maps/lftawa9/id-2');
  const link2 = within(items[1]).getByRole('link', { name: 'Story 1' });
  expect(link2).toHaveAttribute('href', '/tools/story-maps/46h36we/id-1/edit');
});
test('Home: Display defaults', async () => {
  fetchHomeData.mockReturnValue(
    Promise.resolve({
      groups: [],
      landscapes: [],
    })
  );
  await setup();
  expect(screen.getByText(/FIND YOUR LANDSCAPE/i)).toBeInTheDocument();
  expect(screen.getByText(/Groups connect people/i)).toBeInTheDocument();
  expect(
    screen.getByText(
      /Create an impactful story using maps, photos, videos, audio recordings and narrative/i
    )
  ).toBeInTheDocument();
});
