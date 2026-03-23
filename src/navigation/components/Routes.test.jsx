/*
 * Copyright © 2026 Technology Matters
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

import { render, screen } from 'terraso-web-client/tests/utils';

import RoutesComponent from 'terraso-web-client/navigation/components/Routes';

jest.mock('terraso-web-client/storyMap/components/StoryMapsToolHome', () => ({
  __esModule: true,
  default: () => <div>Story Maps Tool Home</div>,
}));

test('Routes: /tools redirects to /tools/story-maps', async () => {
  window.history.pushState({}, '', '/tools');

  await render(<RoutesComponent />, {
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

  expect(await screen.findByText('Story Maps Tool Home')).toBeInTheDocument();
});
