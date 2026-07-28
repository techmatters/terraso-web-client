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

import {
  act,
  fireEvent,
  render,
  screen,
  within,
} from 'terraso-web-client/tests/utils';
import _ from 'lodash/fp';
import * as terrasoApi from 'terraso-client-shared/terrasoApi/api';

import Home from 'terraso-web-client/home/components/Home';
import {
  fetchFeaturedStoryMaps,
  fetchHomeStoryMaps,
} from 'terraso-web-client/home/homeService';

jest.mock('terraso-client-shared/terrasoApi/api');

jest.mock('terraso-web-client/home/homeService', () => ({
  ...jest.requireActual('terraso-web-client/home/homeService'),
  fetchFeaturedStoryMaps: jest.fn(),
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
  fetchFeaturedStoryMaps.mockReturnValue(Promise.resolve([]));
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
              configuration: JSON.stringify({
                featuredImage: {
                  signedUrl: 'https://example.com/story-map-1.png',
                  description: 'Story 1 featured image',
                },
              }),
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

  const link1 = within(items[0]).getByRole('link', { name: 'Story 1' });
  expect(link1).toHaveAttribute('href', '/tools/story-maps/46h36we/id-1/edit');
  expect(
    within(items[1]).getByRole('img', { name: 'Story 2' })
  ).toHaveAttribute('src', '/storyMap/terraso-story-maps-img.jpg');
  const link2 = within(items[1]).getByRole('link', { name: 'Story 2' });
  expect(link2).toHaveAttribute('href', '/tools/story-maps/lftawa9/id-2/edit');
  const image = within(items[0]).getByRole('img', {
    name: 'Story 1 featured image',
  });
  expect(image).toHaveAttribute('src', 'https://example.com/story-map-1.png');
  await act(async () => fireEvent.error(image));
  expect(image).toHaveAttribute('src', '/storyMap/terraso-story-maps-img.jpg');
  expect(
    screen.getByRole('link', { name: 'Make a Story Map' })
  ).toHaveAttribute('href', '/tools/story-maps/new');
  const tutorialsLink = screen.getByRole('link', {
    name: 'Story map tutorials',
  });
  expect(tutorialsLink).toHaveAttribute('href', 'https://terraso.org/help/');
  expect(tutorialsLink).toHaveAttribute('target', '_blank');
  expect(tutorialsLink).toHaveAttribute('rel', 'noopener noreferrer');
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

test('Home: drafts are ordered by last edit time in the mixed story map list', async () => {
  terrasoApi.requestGraphQL.mockReturnValue(
    Promise.resolve({
      storyMaps: {
        edges: [
          {
            node: {
              id: 'published-1',
              slug: 'published-1',
              storyMapId: 'published-1',
              title: 'Published story map',
              isPublished: true,
              publishedAt: '2024-01-01T00:00:00.000000+00:00',
              updatedAt: '2024-01-01T00:00:00.000000+00:00',
              createdBy: {
                userId: 'user-1',
                firstName: 'Pablo',
                lastName: 'Perez',
              },
            },
          },
          {
            node: {
              id: 'draft-1',
              slug: 'draft-1',
              storyMapId: 'draft-1',
              title: 'Draft story map',
              isPublished: false,
              updatedAt: '2025-01-01T00:00:00.000000+00:00',
              createdBy: {
                userId: 'user-2',
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

  expect(
    within(items[0]).getByRole('link', { name: 'Draft story map' })
  ).toBeInTheDocument();
  expect(
    within(items[1]).getByRole('link', { name: 'Published story map' })
  ).toBeInTheDocument();
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

test('Home: Display featured story maps gallery', async () => {
  fetchHomeStoryMaps.mockReturnValue(Promise.resolve([]));
  fetchFeaturedStoryMaps.mockReturnValue(
    Promise.resolve([
      {
        id: 'featured-1',
        slug: 'featured-story-1',
        storyMapId: 'featured-1',
        title: 'Node title should not be used',
        config: {
          title: 'This outstanding story map',
          description:
            'This is the meta description for this sensational story map!',
          featuredImage: {
            signedUrl: 'https://example.com/story-map-1.png',
            description: 'Story map 1 featured image',
          },
        },
      },
      {
        id: 'featured-2',
        slug: 'featured-story-2',
        storyMapId: 'featured-2',
        title: 'Node fallback title 2',
        config: {
          title:
            'This outstanding story map with a longer title that must wrap',
          description: 'Another featured description.',
        },
      },
      {
        id: 'featured-3',
        slug: 'featured-story-3',
        storyMapId: 'featured-3',
        title: 'Node fallback title 3',
        config: {
          title: 'Third featured story map',
          description: 'Third featured description.',
        },
      },
    ])
  );

  await setup();

  expect(
    screen.getByRole('heading', { name: 'Featured Story Maps' })
  ).toBeInTheDocument();
  expect(
    screen.getByRole('link', {
      name: 'Story map 1 featured image This outstanding story map This is the meta description for this sensational story map!',
    })
  ).toHaveAttribute('href', '/tools/story-maps/featured-1/featured-story-1');
  expect(
    screen.getByText(
      /This is the meta description for this sensational story map!/i
    )
  ).toBeInTheDocument();
  expect(
    screen.getByRole('img', { name: 'Story map 1 featured image' })
  ).toHaveAttribute('src', 'https://example.com/story-map-1.png');
});

test('Home: Featured story maps fall back to first chapter description and default image', async () => {
  fetchHomeStoryMaps.mockReturnValue(Promise.resolve([]));
  fetchFeaturedStoryMaps.mockReturnValue(
    Promise.resolve([
      {
        id: 'featured-4',
        slug: 'featured-story-4',
        storyMapId: 'featured-4',
        title: 'Node fallback title 4',
        config: {
          title: 'Chapter preview story map',
          chapters: [
            {
              description: [
                {
                  children: [
                    {
                      text: 'First chapter description used for the card preview when no story map description is configured.',
                    },
                  ],
                },
              ],
            },
          ],
        },
      },
    ])
  );

  await setup();

  expect(screen.getByText('Chapter preview story map')).toBeInTheDocument();
  expect(
    screen.getByText(
      'First chapter description used for the card preview when no story map description is configured.'
    )
  ).toBeInTheDocument();
  expect(
    screen.getByRole('img', { name: 'Chapter preview story map' })
  ).toHaveAttribute('src', '/storyMap/terraso-story-maps-img.jpg');
});

test('Home: Featured story maps render no description when none is configured', async () => {
  fetchHomeStoryMaps.mockReturnValue(Promise.resolve([]));
  fetchFeaturedStoryMaps.mockReturnValue(
    Promise.resolve([
      {
        id: 'featured-5',
        slug: 'featured-story-5',
        storyMapId: 'featured-5',
        title: 'Node fallback title 5',
        config: {
          title: 'No description story map',
          chapters: [],
        },
      },
    ])
  );

  await setup();

  expect(screen.getByText('No description story map')).toBeInTheDocument();
  expect(
    screen.queryByText(
      /Inspire your audience with a free, easy to use, and powerful web app/i
    )
  ).not.toBeInTheDocument();
});

test('Home: Ignore featured story map fetch failures', async () => {
  fetchHomeStoryMaps.mockReturnValue(Promise.resolve([]));
  fetchFeaturedStoryMaps.mockImplementation(
    jest.requireActual('terraso-web-client/home/homeService')
      .fetchFeaturedStoryMaps
  );
  terrasoApi.requestGraphQL.mockRejectedValueOnce('not_found');

  await setup();

  expect(
    screen.getByText(
      /Create and share interactive story maps to visualize your landscape data and community narratives/i
    )
  ).toBeInTheDocument();
  expect(
    screen.queryByRole('heading', { name: 'Featured Story Maps' })
  ).not.toBeInTheDocument();
  expect(
    screen.queryByText(/Error loading data\. not_found/i)
  ).not.toBeInTheDocument();
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
