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

import { render, screen, waitFor } from 'terraso-web-client/tests/utils';
import _ from 'lodash/fp';
import * as terrasoApi from 'terraso-client-shared/terrasoApi/api';

import UserStoryMap from 'terraso-web-client/storyMap/components/UserStoryMap';

jest.mock('terraso-client-shared/terrasoApi/api');

jest.mock('terraso-web-client/storyMap/components/StoryMap', () => () => (
  <section aria-label="Story Map"></section>
));

const getStoryMapResponse = storyMap =>
  _.set(
    'storyMaps.edges[0].node',
    {
      id: 'id-1',
      storyMapId: 'id-1',
      slug: 'story-1',
      title: 'Story 1',
      configuration: JSON.stringify({
        title: 'Story 1',
      }),
      ...storyMap,
    },
    {}
  );

test('UserStoryMap: Display loader', async () => {
  terrasoApi.requestGraphQL.mockReturnValue(new Promise(() => {}));
  await render(<UserStoryMap />);
  const loader = screen.getByRole('progressbar', {
    name: 'Loading',
  });
  expect(loader).toBeInTheDocument();
});
test('UserStoryMap: renders correctly', async () => {
  terrasoApi.requestGraphQL.mockResolvedValue(getStoryMapResponse());
  await render(<UserStoryMap />);

  expect(screen.getByRole('region', { name: 'Story Map' })).toBeInTheDocument();
});
test('UserStoryMap: anonymous users see share and join actions', async () => {
  terrasoApi.requestGraphQL.mockResolvedValue(getStoryMapResponse());

  await render(<UserStoryMap />, {
    account: {
      hasToken: false,
      currentUser: {
        fetching: false,
        data: {},
      },
    },
  });

  expect(
    await screen.findByRole('button', { name: 'Share story map' })
  ).toBeInTheDocument();
  expect(
    screen.getByRole('link', { name: 'Join Terraso' })
  ).toBeInTheDocument();
  expect(
    screen.queryByRole('link', { name: 'Edit Story Map' })
  ).not.toBeInTheDocument();
});

test('UserStoryMap: signed-in non-editors only see the share action', async () => {
  terrasoApi.requestGraphQL.mockResolvedValue(
    getStoryMapResponse({
      createdBy: {
        id: 'another-user',
      },
    })
  );

  await render(<UserStoryMap />, {
    account: {
      hasToken: true,
      currentUser: {
        fetching: false,
        data: {
          id: 'current-user',
          firstName: 'Test',
          lastName: 'User',
        },
      },
    },
  });

  expect(
    await screen.findByRole('button', { name: 'Share story map' })
  ).toBeInTheDocument();

  await waitFor(() => {
    expect(
      screen.queryByRole('link', { name: 'Edit Story Map' })
    ).not.toBeInTheDocument();
  });

  expect(
    screen.queryByRole('link', { name: 'Join Terraso' })
  ).not.toBeInTheDocument();
});

test('UserStoryMap: editors see share and edit actions', async () => {
  terrasoApi.requestGraphQL.mockResolvedValue(
    getStoryMapResponse({
      createdBy: {
        id: 'current-user',
      },
    })
  );

  await render(<UserStoryMap />, {
    account: {
      hasToken: true,
      currentUser: {
        fetching: false,
        data: {
          id: 'current-user',
          firstName: 'Test',
          lastName: 'User',
        },
      },
    },
  });

  expect(
    await screen.findByRole('button', { name: 'Share story map' })
  ).toBeInTheDocument();
  expect(
    await screen.findByRole('link', { name: 'Edit Story Map' })
  ).toBeInTheDocument();
  expect(
    screen.queryByRole('button', { name: 'Delete Story 1' })
  ).not.toBeInTheDocument();
  expect(
    screen.queryByRole('link', { name: 'Join Terraso' })
  ).not.toBeInTheDocument();
});
