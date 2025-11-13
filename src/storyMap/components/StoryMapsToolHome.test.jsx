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

test('StoryMapsToolHome: samples renders correctly', async () => {
  terrasoApi.requestGraphQL.mockReturnValue(
    Promise.resolve({
      samples: {
        edges: [
          {
            node: {
              id: 'id-1',
              slug: 'id-1',
              storyMapId: '46h36we',
              title: 'Story 1',
              isPublished: false,
              updatedAt: '2023-01-31T22:25:42.916303+00:00',
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
            },
          },
        ],
      },
    })
  );

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
    screen.getByRole('region', {
      name: 'Community Story Maps',
    })
  ).toBeInTheDocument();
  const list = screen.getByRole('list', {
    name: 'Community Story Maps',
  });
  const items = within(list).getAllByRole('listitem');
  expect(items.length).toBe(2);

  expect(
    within(items[0]).getByRole('link', { name: 'Story 2' })
  ).toBeInTheDocument();
  expect(
    within(items[1]).getByRole('link', { name: 'Story 1' })
  ).toBeInTheDocument();
  expect(
    within(items[0]).getByText(/By {{user.firstName}} {{user.lastName}}/i)
  ).toBeInTheDocument();
});

test('StoryMapsToolHome: user story maps render correctly', async () => {
  terrasoApi.requestGraphQL.mockReturnValue(
    Promise.resolve({
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
  const list = screen.getByRole('region', {
    name: "Jodies' Story Maps",
  });
  const items = within(list).getAllByRole('listitem');
  expect(items.length).toBe(2);

  const link2 = within(items[0]).getByRole('link', { name: 'Story 2' });
  expect(link2).toHaveAttribute('href', '/tools/story-maps/lftawa9/id-2/edit');
  const link1 = within(items[1]).getByRole('link', { name: 'Story 1' });
  expect(link1).toHaveAttribute('href', '/tools/story-maps/46h36we/id-1/edit');
});

test('StoryMapsToolHome: accept story map invite', async () => {
  const trackEvent = jest.fn();
  useAnalytics.mockReturnValue({
    trackEvent,
  });
  mockTerrasoAPIrequestGraphQL({
    'query storyMapsHome': Promise.resolve({
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
