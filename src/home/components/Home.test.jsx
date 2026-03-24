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

import { render, screen, within } from 'terraso-web-client/tests/utils';
import _ from 'lodash/fp';
import * as terrasoApi from 'terraso-client-shared/terrasoApi/api';

import Home from 'terraso-web-client/home/components/Home';
import { fetchHomeStoryMaps } from 'terraso-web-client/home/homeService';

jest.mock('terraso-client-shared/terrasoApi/api');

jest.mock('terraso-web-client/home/homeService', () => ({
  ...jest.requireActual('terraso-web-client/home/homeService'),
  fetchHomeStoryMaps: jest.fn(),
}));

const setup = async (
  currentUserData = { firstName: 'First', lastName: 'Last' }
) => {
  await render(<Home />, {
    account: {
      hasToken: true,
      currentUser: {
        fetching: false,
        data: currentUserData,
      },
    },
  });
};

beforeEach(() => {
  fetchHomeStoryMaps.mockImplementation(
    jest.requireActual('terraso-web-client/home/homeService').fetchHomeStoryMaps
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
  expect(loaders.length).toBe(1);
  loaders.forEach(role => expect(role).toBeInTheDocument());
});
test('Home: Display CTA cards for Landscapes and Groups', async () => {
  terrasoApi.requestGraphQL.mockReturnValue(
    Promise.resolve({
      groups: {
        edges: [
          {
            node: {
              id: 'id-1',
              slug: 'id-1',
              name: 'Group 1',
              membershipList: {
                accountMembership: {
                  id: 'id-1',
                  userRole: 'member',
                  membershipStatus: 'APPROVED',
                },
              },
            },
          },
        ],
      },
      landscapes: {
        edges: [
          {
            node: {
              id: 'id-1',
              slug: 'landsacpe-1',
              name: 'Landscape 1',
              membershipList: _.set('accountMembership.userRole', 'member', {}),
            },
          },
        ],
      },
    })
  );
  await setup();

  expect(
    screen.getByText(/Create or join a landscape to work with partners/i)
  ).toBeInTheDocument();
  expect(
    screen.getByText(/Collaborate with organizations, interest groups/i)
  ).toBeInTheDocument();
  expect(screen.queryByText('Landscape 1')).not.toBeInTheDocument();
  expect(screen.queryByText('Group 1')).not.toBeInTheDocument();
  expect(screen.queryByText(/Data Collection/i)).not.toBeInTheDocument();
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

  const list = within(
    screen.getByRole('region', { name: 'Terraso Story Maps' })
  );
  const items = list.getAllByRole('listitem');
  expect(items.length).toBe(2);

  const link1 = within(items[0]).getByRole('link', { name: 'Story 2' });
  expect(link1).toHaveAttribute('href', '/tools/story-maps/lftawa9/id-2/edit');
  const link2 = within(items[1]).getByRole('link', { name: 'Story 1' });
  expect(link2).toHaveAttribute('href', '/tools/story-maps/46h36we/id-1/edit');
  expect(
    screen.getByRole('link', { name: 'Make a Story Map' })
  ).toHaveAttribute('href', '/tools/story-maps/new');
  expect(screen.getByRole('link', { name: 'My Story Maps' })).toHaveAttribute(
    'href',
    '/tools/story-maps'
  );
});

test('Home: Display only two most recent Story Maps and link to My Story Maps', async () => {
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
              isPublished: true,
              publishedAt: '2023-01-31T22:25:42.916303+00:00',
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
              publishedAt: '2024-01-31T22:25:42.916303+00:00',
              updatedAt: '2024-01-31T22:25:42.916303+00:00',
              createdBy: {
                userId: 'user-2',
                firstName: 'Pedro',
                lastName: 'Paez',
              },
            },
          },
          {
            node: {
              id: 'id-3',
              slug: 'id-3',
              storyMapId: 'abca123',
              title: 'Story 3',
              isPublished: true,
              publishedAt: '2025-01-31T22:25:42.916303+00:00',
              updatedAt: '2025-01-31T22:25:42.916303+00:00',
              createdBy: {
                userId: 'user-3',
                firstName: 'Maria',
                lastName: 'Gomez',
              },
            },
          },
        ],
      },
    })
  );
  await setup();

  const list = within(
    screen.getByRole('region', { name: 'Terraso Story Maps' })
  );
  const items = list.getAllByRole('listitem');
  expect(items.length).toBe(2);

  expect(
    within(items[0]).getByRole('link', { name: 'Story 3' })
  ).toBeInTheDocument();
  expect(
    within(items[1]).getByRole('link', { name: 'Story 2' })
  ).toBeInTheDocument();
  expect(
    screen.queryByRole('link', { name: 'Story 1' })
  ).not.toBeInTheDocument();

  expect(
    screen.getByRole('link', { name: 'Make a Story Map' })
  ).toHaveAttribute('href', '/tools/story-maps/new');
  const myStoryMapsLink = screen.getByRole('link', { name: 'My Story Maps' });
  expect(myStoryMapsLink).toHaveAttribute('href', '/tools/story-maps');
});

test('Home: Display defaults', async () => {
  fetchHomeStoryMaps.mockReturnValue(Promise.resolve([]));
  await setup();
  expect(
    screen.getByText(/Create or join a landscape to work with partners/i)
  ).toBeInTheDocument();
  expect(
    screen.getByText(/Collaborate with organizations, interest groups/i)
  ).toBeInTheDocument();
  expect(
    screen.getByText(
      /Create and share interactive story maps to visualize your landscape data and community narratives/i
    )
  ).toBeInTheDocument();
  expect(screen.queryByText(/Data Collection/i)).not.toBeInTheDocument();
});

test('Home: Main heading removed', async () => {
  fetchHomeStoryMaps.mockReturnValue(Promise.resolve([]));
  await setup();
  expect(screen.queryByText(/^Home$/i)).toBeNull();
});

test('Home: Main heading removed (default user)', async () => {
  fetchHomeStoryMaps.mockReturnValue(Promise.resolve([]));
  await setup({ firstName: undefined, lastName: undefined });
  expect(screen.queryByText(/^Home$/i)).toBeNull();
});
