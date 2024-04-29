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
import React, { act } from 'react';
import { useLocation } from 'react-router-dom';

import Navigation from 'navigation/components/Navigation';

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useLocation: jest.fn(),
}));

const setup = async () => {
  await render(<Navigation />, {
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

test('Navigation: Show tabs', async () => {
  useLocation.mockReturnValue({
    pathname: '/',
  });
  await setup();
  expect(screen.getByRole('link', { name: 'Home' })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Landscapes' })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Groups' })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute(
    'aria-current',
    'page'
  );
});
test('Navigation: Test initial', async () => {
  useLocation.mockReturnValue({
    pathname: '/landscapes',
  });
  await setup();
  expect(screen.getByRole('link', { name: 'Home' })).not.toHaveAttribute(
    'aria-current',
    'page'
  );
  expect(screen.getByRole('link', { name: 'Landscapes' })).toHaveAttribute(
    'aria-current',
    'page'
  );
  expect(screen.getByRole('link', { name: 'Groups' })).not.toHaveAttribute(
    'aria-current',
    'page'
  );
});
test('Navigation: Test select', async () => {
  useLocation.mockReturnValue({
    pathname: '/landscapes/landscape-slug',
  });
  await setup();
  expect(screen.getByRole('link', { name: 'Home' })).not.toHaveAttribute(
    'aria-current',
    'page'
  );
  expect(screen.getByRole('link', { name: 'Landscapes' })).toHaveAttribute(
    'aria-current',
    'page'
  );
  expect(screen.getByRole('link', { name: 'Groups' })).not.toHaveAttribute(
    'aria-current',
    'page'
  );
});
test('Navigation: Test navigation', async () => {
  useLocation
    .mockReturnValueOnce({
      pathname: '/',
    })
    .mockReturnValueOnce({
      pathname: '/landscapes',
    });
  await setup();
  expect(useLocation).toHaveBeenCalled();
  await act(async () =>
    fireEvent.click(screen.getByRole('link', { name: 'Landscapes' }))
  );
  expect(screen.getByRole('link', { name: 'Home' })).not.toHaveAttribute(
    'aria-current',
    'page'
  );
  expect(screen.getByRole('link', { name: 'Landscapes' })).toHaveAttribute(
    'aria-current',
    'page'
  );
});
test('Navigation: none selected', async () => {
  useLocation.mockReturnValue({
    pathname: '/other',
  });
  await setup();
  expect(screen.getByRole('link', { name: 'Home' })).not.toHaveAttribute(
    'aria-current',
    'page'
  );
  expect(screen.getByRole('link', { name: 'Landscapes' })).not.toHaveAttribute(
    'aria-current',
    'page'
  );
  expect(screen.getByRole('link', { name: 'Groups' })).not.toHaveAttribute(
    'aria-current',
    'page'
  );
});
