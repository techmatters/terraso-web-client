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
import { render, screen } from 'tests/utils';
import App from 'App';
import { useLocation } from 'react-router-dom';

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useLocation: jest.fn(),
}));

jest.mock('navigation/components/Routes', () => ({
  ...jest.requireActual('navigation/components/Routes'),
  __esModule: true,
  default: jest.fn(),
}))

const setup = async () => {
  await render(<App />, {
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
  });
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
