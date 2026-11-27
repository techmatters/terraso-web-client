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

import { act, render, screen } from 'terraso-web-client/tests/utils';
// The server route registry lives outside the client import alias.
// eslint-disable-next-line no-restricted-imports
import serverPaths from '../../../server/appPaths.cjs';

import RoutesComponent, {
  paths,
} from 'terraso-web-client/navigation/components/Routes';

jest.mock('terraso-web-client/account/components/AccountLogin', () => ({
  __esModule: true,
  default: () => <div>Account Login</div>,
}));

jest.mock('terraso-web-client/storyMap/components/StoryMapsToolHome', () => ({
  __esModule: true,
  default: () => <div>Story Maps Tool Home</div>,
}));

test('server recognizes every client route and no extra routes', () => {
  expect([...serverPaths].sort()).toEqual(
    paths
      .map(({ path }) => path)
      .filter(path => path !== '*')
      .sort()
  );
});

test('unmatched routes are public and protected routes still require authentication', async () => {
  window.history.pushState({}, '', '/not-a-real-route');

  await render(<RoutesComponent />, {
    account: { hasToken: false, currentUser: { fetching: false, data: null } },
  });

  expect(await screen.findByText('Page not found')).toBeInTheDocument();
  expect(window.location.pathname).toBe('/not-a-real-route');
  await act(async () => {
    window.history.pushState({}, '', '/groups/new');
    window.dispatchEvent(new PopStateEvent('popstate'));
  });

  expect(await screen.findByText('Account Login')).toBeInTheDocument();
  expect(window.location.pathname).toBe('/account');
  expect(new URLSearchParams(window.location.search).get('referrer')).toBe(
    '/groups/new'
  );
});

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
  expect(window.location.pathname).toBe('/tools/story-maps');
});
