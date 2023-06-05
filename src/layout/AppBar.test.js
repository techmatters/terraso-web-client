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
import { fireEvent, render, screen } from 'tests/utils';
import React from 'react';
import Cookies from 'js-cookie';
import { act } from 'react-dom/test-utils';
import useMediaQuery from '@mui/material/useMediaQuery';
import AppBar from 'layout/AppBar';

jest.mock('@mui/material/useMediaQuery');
jest.mock('js-cookie');

const setup = async () => {
  await render(<AppBar />, {
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
};

beforeEach(() => {
  global.fetch = jest.fn();
});

test('AppBar: Dont display if no user', async () => {
  await render(<AppBar />, {
    account: {
      hasToken: true,
      currentUser: {
        fetching: false,
        data: null,
      },
    },
  });

  expect(() => screen.getByAltText(/Terraso/i)).toThrow(
    'Unable to find an element'
  );
});
test('AppBar: Display terraso title', async () => {
  await setup();
  expect(screen.getByAltText(/Terraso/i)).toBeInTheDocument();
});
test('AppBar: Logo display', async () => {
  useMediaQuery.mockReturnValue(false);
  await setup();
  expect(screen.getByRole('img', { name: /Terraso/i })).toHaveAttribute(
    'src',
    'logo.svg'
  );
});
test('AppBar: Logo display (small)', async () => {
  useMediaQuery.mockReturnValue(true);
  await setup();
  expect(screen.getByRole('img', { name: /Terraso/i })).toHaveAttribute(
    'src',
    'logo-square.svg'
  );
});
test('AppBar: Sign out', async () => {
  global.fetch.mockResolvedValueOnce({
    status: 200,
  });
  useMediaQuery.mockReturnValue(false);
  await setup();
  expect(screen.getByRole('img', { name: /Terraso/i })).toHaveAttribute(
    'src',
    'logo.svg'
  );
  await act(async () =>
    fireEvent.click(screen.getByRole('button', { name: 'Sign Out' }))
  );
  expect(Cookies.remove).toHaveBeenCalledTimes(2);
  const saveCall = Cookies.remove.mock.calls[1];
  expect(saveCall[1]).toStrictEqual({
    domain: '127.0.0.1',
    path: '/',
  });
});
