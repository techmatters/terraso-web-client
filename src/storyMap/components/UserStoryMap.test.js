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
import { render, screen } from 'tests/utils';

import _ from 'lodash/fp';

import * as terrasoApi from 'terrasoBackend/api';

import UserStoryMap from './UserStoryMap';

jest.mock('terrasoBackend/api');

jest.mock('./StoryMap', () => () => <section aria-label="Story Map"></section>);

test('UserStoryMap: Display loader', async () => {
  terrasoApi.requestGraphQL.mockReturnValue(new Promise(() => {}));
  await render(<UserStoryMap />);
  const loader = screen.getByRole('progressbar', {
    name: 'Loading',
  });
  expect(loader).toBeInTheDocument();
});
test('UserStoryMap: renders correctly', async () => {
  terrasoApi.requestGraphQL.mockResolvedValue(
    _.set(
      'storyMaps.edges[0].node',
      {
        id: 'id-1',
        slug: 'id-1',
        title: 'Story 1',
        configuration: JSON.stringify({
          title: 'Story 1',
        }),
      },
      {}
    )
  );
  await render(<UserStoryMap />);

  expect(screen.getByRole('region', { name: 'Story Map' })).toBeInTheDocument();
});
