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
  waitFor,
  within,
} from 'terraso-web-client/tests/utils';
import * as terrasoApi from 'terraso-client-shared/terrasoApi/api';
import { mockTerrasoAPIrequestGraphQL } from 'terraso-web-client/tests/apiUtils';

import { useAnalytics } from 'terraso-web-client/monitoring/analytics';
import StoryMapsToolsHome from 'terraso-web-client/storyMap/components/StoryMapsToolHome';

jest.mock('terraso-client-shared/terrasoApi/api');

jest.mock('terraso-web-client/monitoring/analytics', () => ({
  ...jest.requireActual('terraso-web-client/monitoring/analytics'),
  useAnalytics: jest.fn(),
}));

beforeEach(() => {
  useAnalytics.mockReturnValue({
    trackEvent: jest.fn(),
  });
});

test('StoryMapsToolHome: community story maps are not rendered', async () => {
  mockTerrasoAPIrequestGraphQL({
    'query userStoryMapsHome': Promise.resolve({
      userStoryMaps: {
        edges: [],
      },
    }),
    'query featuredStoryMaps': Promise.resolve({
      storyMaps: {
        edges: [],
      },
    }),
  });

  await render(<StoryMapsToolsHome />, {
    account: {
      currentUser: {
        data: {
          email: 'account@email.com',
          firstName: 'Jodie',
        },
      },
    },
  });

  expect(
    screen.getByRole('heading', { name: 'Terraso Story Maps' })
  ).toBeInTheDocument();
  expect(
    screen.getByRole('link', { name: 'Create Story Map' })
  ).toBeInTheDocument();
  expect(
    screen.queryByRole('region', {
      name: 'Community Story Maps',
    })
  ).not.toBeInTheDocument();
});

test('StoryMapsToolHome: user story maps render correctly', async () => {
  mockTerrasoAPIrequestGraphQL({
    'query userStoryMapsHome': Promise.resolve({
      userStoryMaps: {
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
    }),
    'query featuredStoryMaps': Promise.resolve({
      storyMaps: {
        edges: [],
      },
    }),
  });

  await render(<StoryMapsToolsHome />, {
    account: {
      currentUser: {
        data: {
          email: 'account@email.com',
          firstName: 'Jodies',
        },
      },
    },
  });

  expect(
    screen.getByRole('heading', { name: 'Terraso Story Maps' })
  ).toBeInTheDocument();
  expect(
    screen.getByRole('link', { name: 'Create Story Map' })
  ).toBeInTheDocument();
  expect(
    screen.queryByRole('region', {
      name: 'Community Story Maps',
    })
  ).not.toBeInTheDocument();
  const list = screen.getByRole('region', {
    name: "Jodies' Story Maps",
  });
  const items = within(list).getAllByRole('listitem');
  expect(items.length).toBe(2);

  const link2 = within(items[0]).getByRole('link', { name: 'Story 1' });
  expect(link2).toHaveAttribute('href', '/tools/story-maps/46h36we/id-1/edit');
  expect(
    within(items[1]).getByRole('img', { name: 'Story 2' })
  ).toHaveAttribute('src', '/storyMap/terraso-story-maps-img.jpg');
  const link1 = within(items[1]).getByRole('link', { name: 'Story 2' });
  expect(link1).toHaveAttribute('href', '/tools/story-maps/lftawa9/id-2/edit');
  const image = within(items[0]).getByRole('img', {
    name: 'Story 1 featured image',
  });
  expect(image).toHaveAttribute('src', 'https://example.com/story-map-1.png');
  await act(async () => fireEvent.error(image));
  expect(image).toHaveAttribute('src', '/storyMap/terraso-story-maps-img.jpg');
  expect(
    screen.queryByRole('link', { name: 'My Story Maps' })
  ).not.toBeInTheDocument();
});

test('StoryMapsToolHome: featured story maps render correctly', async () => {
  mockTerrasoAPIrequestGraphQL({
    'query userStoryMapsHome': Promise.resolve({
      userStoryMaps: {
        edges: [],
      },
    }),
    'query featuredStoryMaps': Promise.resolve({
      storyMaps: {
        edges: [
          {
            node: {
              id: 'featured-1',
              slug: 'featured-story-1',
              storyMapId: 'featured-1',
              title: 'Node title should not be used',
              publishedAt: '2024-01-01T00:00:00.000000+00:00',
              publishedConfiguration: JSON.stringify({
                title: 'This outstanding story map',
                description:
                  'This is the meta description for this sensational story map!',
                featuredImage: {
                  signedUrl: 'https://example.com/story-map-1.png',
                  description: 'Story map 1 featured image',
                },
              }),
            },
          },
        ],
      },
    }),
  });

  await render(<StoryMapsToolsHome />, {
    account: {
      currentUser: {
        data: {
          email: 'account@email.com',
          firstName: 'Jodie',
        },
      },
    },
  });

  expect(
    screen.getByRole('heading', { name: 'Featured Story Maps' })
  ).toBeInTheDocument();
  expect(
    screen.getByRole('link', {
      name: 'Story map 1 featured image This outstanding story map This is the meta description for this sensational story map!',
    })
  ).toHaveAttribute('href', '/tools/story-maps/featured-1/featured-story-1');
});

test('StoryMapsToolHome: story maps are ordered by last update time', async () => {
  mockTerrasoAPIrequestGraphQL({
    'query userStoryMapsHome': Promise.resolve({
      userStoryMaps: {
        edges: [
          {
            node: {
              id: 'published-1',
              slug: 'published-1',
              storyMapId: 'published-1',
              title: 'Published story map',
              isPublished: true,
              publishedAt: '2024-01-01T00:00:00.000000+00:00',
              updatedAt: '2025-02-01T00:00:00.000000+00:00',
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
    }),
    'query featuredStoryMaps': Promise.resolve({
      storyMaps: {
        edges: [],
      },
    }),
  });

  await render(<StoryMapsToolsHome />, {
    account: {
      currentUser: {
        data: {
          email: 'account@email.com',
          firstName: 'Jodies',
        },
      },
    },
  });

  const list = screen.getByRole('region', {
    name: "Jodies' Story Maps",
  });
  const items = within(list).getAllByRole('listitem');

  expect(
    within(items[0]).getByRole('link', { name: 'Published story map' })
  ).toBeInTheDocument();
  expect(
    within(items[1]).getByRole('link', { name: 'Draft story map' })
  ).toBeInTheDocument();
});

test('StoryMapsToolHome: user story map fetch failure clears page loader', async () => {
  mockTerrasoAPIrequestGraphQL({
    'query userStoryMapsHome': Promise.reject('not_found'),
    'query featuredStoryMaps': Promise.resolve({
      storyMaps: {
        edges: [],
      },
    }),
  });

  await render(<StoryMapsToolsHome />, {
    account: {
      currentUser: {
        data: {
          email: 'account@email.com',
          firstName: 'Jodie',
        },
      },
    },
  });

  await waitFor(() => {
    expect(screen.queryByLabelText('Loading')).not.toBeInTheDocument();
  });

  expect(
    screen.getByRole('heading', { name: 'Terraso Story Maps' })
  ).toBeInTheDocument();
  expect(
    screen.getByRole('link', { name: 'Create Story Map' })
  ).toBeInTheDocument();
});

test('StoryMapsToolHome: accept story map invite', async () => {
  const trackEvent = jest.fn();
  useAnalytics.mockReturnValue({
    trackEvent,
  });
  mockTerrasoAPIrequestGraphQL({
    'query userStoryMapsHome': Promise.resolve({
      userStoryMaps: {
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
                userId: 'other-user-id',
                firstName: 'Pablo',
                lastName: 'Perez',
              },
              membershipList: {
                membershipsCount: 0,
                accountMembership: {
                  id: '12eb041f-e847-4f78-89ec-46a6a6b7c5c6',
                  userRole: 'editor',
                  membershipStatus: 'PENDING',
                },
              },
            },
          },
        ],
      },
    }),
    'query featuredStoryMaps': Promise.resolve({
      storyMaps: {
        edges: [],
      },
    }),
    'mutation approveMembership': Promise.resolve({
      approveStoryMapMembership: {
        membership: {
          id: 'membership-id-1',
        },
        storyMap: {
          id: 'story-map-id-1',
          title: 'Hello world',
          storyMapId: 'story-map-id-1',
          slug: 'hello-world',
        },
      },
    }),
  });

  await render(<StoryMapsToolsHome />, {
    account: {
      currentUser: {
        data: {
          email: 'account@email.com',
          firstName: 'Jodies',
        },
      },
    },
  });

  const storyMapItem = screen.getByRole('listitem', { name: '' });

  const acceptButton = within(storyMapItem).getByRole('button', {
    name: 'Accept',
  });

  await act(async () => {
    fireEvent.click(acceptButton);
  });

  expect(trackEvent).toHaveBeenCalledWith('storymap.share.accept', {
    props: { map: 'id-1' },
  });
});

test('StoryMapsToolHome: published story map share opens the share dialog for the selected story map', async () => {
  mockTerrasoAPIrequestGraphQL({
    'query userStoryMapsHome': Promise.resolve({
      userStoryMaps: {
        edges: [
          {
            node: {
              id: 'id-1',
              slug: 'id-1',
              storyMapId: 'aaa111',
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
              publishedAt: '2023-01-31T22:25:42.916303+00:00',
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
    }),
    'query featuredStoryMaps': Promise.resolve({
      storyMaps: {
        edges: [],
      },
    }),
  });

  await render(<StoryMapsToolsHome />, {
    account: {
      currentUser: {
        data: {
          email: 'account@email.com',
          firstName: 'Jodies',
        },
      },
    },
  });

  const storyMapItem = screen
    .getByRole('link', { name: 'Story 1' })
    .closest('li');

  await act(async () => {
    fireEvent.click(
      within(storyMapItem).getByRole('button', { name: 'Share' })
    );
  });

  expect(
    screen.getByRole('heading', { name: 'Share Story 1' })
  ).toBeInTheDocument();
});

test('StoryMapsToolHome: draft story map publish button opens a confirmation dialog before publishing', async () => {
  const trackEvent = jest.fn();
  useAnalytics.mockReturnValue({
    trackEvent,
  });
  terrasoApi.request.mockResolvedValue({
    id: 'id-1',
    slug: 'id-1',
    storyMapId: '46h36we',
    title: 'Story 1',
    publishedAt: '2024-02-01T00:00:00.000000+00:00',
    configuration: JSON.stringify({
      featuredImage: {
        signedUrl: 'https://example.com/story-map-1.png',
        description: 'Story 1 featured image',
      },
    }),
  });
  mockTerrasoAPIrequestGraphQL({
    'query userStoryMapsHome': Promise.resolve({
      userStoryMaps: {
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
        ],
      },
    }),
    'query featuredStoryMaps': Promise.resolve({
      storyMaps: {
        edges: [],
      },
    }),
  });

  await render(<StoryMapsToolsHome />, {
    account: {
      currentUser: {
        data: {
          email: 'account@email.com',
          firstName: 'Jodies',
        },
      },
    },
  });

  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: 'Publish' }));
  });

  expect(terrasoApi.request).not.toHaveBeenCalled();
  expect(
    screen.getByRole('heading', { name: 'Publish "Story 1"?' })
  ).toBeInTheDocument();
  expect(
    screen.getByText(
      'Your story map will become visible to anyone with the link.'
    )
  ).toBeInTheDocument();

  await act(async () => {
    fireEvent.click(
      within(screen.getByRole('dialog')).getByRole('button', {
        name: 'Publish',
      })
    );
  });

  expect(terrasoApi.request).toHaveBeenCalledWith({
    path: '/story-map/update/',
    body: expect.any(FormData),
  });
  expect(trackEvent).toHaveBeenCalledWith('storymap.publish', {
    props: {
      'ILM Output': 'Landscape Narratives',
      map: 'id-1',
    },
  });
  expect(screen.getByRole('button', { name: 'Share' })).toBeInTheDocument();
});
