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

import * as terrasoApi from 'terrasoBackend/api';

import StoryMapsToolsHome from './StoryMapsToolHome';

jest.mock('terrasoBackend/api');

test('StoryMapsToolHome: renders correctly', async () => {
  terrasoApi.requestGraphQL.mockReturnValue(
    Promise.resolve({
      storyMaps: {
        edges: [
          {
            node: {
              id: 'id-1',
              slug: 'id-1',
              title: 'Story 1',
              isPublished: false,
              publishedAt: '2023-01-31T22:25:42.916303+00:00',
              createdBy: {
                firstName: 'First',
                lastName: 'Last',
              },
            },
          },
          {
            node: {
              id: 'id-2',
              slug: 'id-2',
              title: 'Story 2',
              isPublished: true,
              publishedAt: '2023-01-31T22:25:42.916303+00:00',
              createdBy: {
                firstName: 'First',
                lastName: 'Last',
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
        },
      },
    },
  });

  expect(
    screen.getByRole('heading', { name: 'Terraso Story Map' })
  ).toBeInTheDocument();
  expect(
    screen.getByRole('link', { name: 'Create Story Map' })
  ).toBeInTheDocument();

  expect(
    screen.getByRole('heading', {
      name: 'Sample story maps: View what others have been working on',
    })
  ).toBeInTheDocument();
  const list = screen.getByRole('list', {
    name: 'Sample story maps: View what others have been working on',
  });
  const items = within(list).getAllByRole('listitem');
  expect(items.length).toBe(2);

  expect(
    within(items[0]).getByRole('link', { name: 'Story 1' })
  ).toBeInTheDocument();
  expect(within(items[0]).getByText(/by First Last/i)).toBeInTheDocument();
  expect(within(items[0]).getByText(/Published on/)).toBeInTheDocument();
});
