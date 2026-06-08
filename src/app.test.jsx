/*
 * Copyright © 2023 Technology Matters
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
import { useLocation } from 'react-router';
import App from 'terraso-web-client/App';

jest.mock('react-router', () => ({
  ...jest.requireActual('react-router'),
  useLocation: jest.fn(),
}));

jest.mock('terraso-web-client/navigation/components/Routes', () => ({
  ...jest.requireActual('terraso-web-client/navigation/components/Routes'),
  __esModule: true,
  default: jest.fn(),
}));

const DEFAULT_STATE = {
  account: {
    hasToken: true,
    currentUser: {
      fetching: false,
      data: {
        email: 'email@email.com',
        firstName: 'John',
        lastName: 'Doe',
      },
    },
  },
};

const setup = async (initialState = DEFAULT_STATE) => {
  await render(<App />, initialState);
};

test('App: Embedded', async () => {
  useLocation.mockReturnValue({
    pathname: '/landscapes/map',
  });
  await setup();

  // header
  expect(screen.queryByRole('navigation')).not.toBeInTheDocument();

  expect(
    screen.queryByRole('button', { name: 'Sign Out' })
  ).not.toBeInTheDocument();

  // footer
  expect(
    screen.queryByRole('link', { name: 'About Terraso' })
  ).not.toBeInTheDocument();
});

test('App: Published story map uses the story map footer component', async () => {
  useLocation.mockReturnValue({
    pathname: '/tools/story-maps/123/test-story-map',
    search: '',
  });
  await setup({
    account: {
      hasToken: false,
      currentUser: {
        fetching: false,
        data: {},
      },
    },
  });

  expect(
    screen.queryByRole('navigation', { name: 'Main' })
  ).not.toBeInTheDocument();
  expect(
    screen.queryByRole('button', { name: 'Sign Out' })
  ).not.toBeInTheDocument();
  expect(
    document.querySelector('#breadcrumbs-share-container')
  ).not.toBeInTheDocument();
  expect(screen.getByRole('img', { name: /Terraso/i })).toHaveAttribute(
    'src',
    '/storyMap/story-maps-footer-logo.svg'
  );
  expect(screen.getByRole('button', { name: 'Sign In' })).toBeInTheDocument();
  expect(
    screen.getByRole('link', { name: 'About Terraso' })
  ).toBeInTheDocument();
});

test('App: Not Embedded', async () => {
  useLocation.mockReturnValue({
    pathname: '/landscapes',
  });
  await setup();

  // header
  expect(screen.getByRole('navigation', { name: 'Main' })).toBeInTheDocument();

  expect(screen.getByRole('button', { name: 'Sign Out' })).toBeInTheDocument();

  // footer
  expect(
    screen.getByRole('link', { name: 'About Terraso' })
  ).toBeInTheDocument();
});
