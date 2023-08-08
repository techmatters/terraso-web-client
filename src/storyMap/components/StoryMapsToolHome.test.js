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
import * as terrasoApi from 'terraso-client-shared/terrasoApi/api';

import StoryMapsToolsHome from './StoryMapsToolHome';

jest.mock('terraso-client-shared/terrasoApi/api');

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
      name: 'Sample story maps: View what others created',
    })
  ).toBeInTheDocument();
  const list = screen.getByRole('list', {
    name: 'Sample story maps: View what others created',
  });
  const items = within(list).getAllByRole('listitem');
  expect(items.length).toBe(2);

  expect(
    within(items[0]).getByRole('link', { name: 'Story 1' })
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
    name: 'Story Maps',
  });
  const items = within(list).getAllByRole('listitem');
  expect(items.length).toBe(2);

  const link2 = within(items[0]).getByRole('link', { name: 'Story 2' });
  expect(link2).toHaveAttribute('href', '/tools/story-maps/lftawa9/id-2');
  const link1 = within(items[1]).getByRole('link', { name: 'Story 1' });
  expect(link1).toHaveAttribute('href', '/tools/story-maps/46h36we/id-1/edit');
});
