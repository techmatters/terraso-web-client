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

import React from 'react';

import { useSearchParams } from 'react-router-dom';

import * as accountService from 'state/account/accountService';

import AccountLogin from 'account/components/AccountLogin';

jest.mock('state/account/accountService');

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useSearchParams: jest.fn(),
}));

beforeEach(() => {
  useSearchParams.mockReturnValue([new URLSearchParams(), () => {}]);
});

test('AccountLogin: Display error', async () => {
  accountService.getAuthURLs.mockRejectedValue('Load error');
  await render(<AccountLogin />);
  expect(screen.getByText(/Load error/i)).toBeInTheDocument();
});

test('AccountLogin: Display loader', async () => {
  accountService.getAuthURLs.mockReturnValue(new Promise(() => {}));
  await render(<AccountLogin />);
  const loader = screen.getByRole('progressbar', {
    name: 'Loading',
  });
  expect(loader).toBeInTheDocument();
});

test('AccountLogin: Display buttons', async () => {
  accountService.getAuthURLs.mockReturnValue(
    Promise.resolve({
      google: 'google.url',
      apple: 'apple.url',
    })
  );
  await render(<AccountLogin />);
  expect(screen.getByText('Continue with Google')).toBeInTheDocument();
  expect(screen.getByText('Continue with Apple')).toBeInTheDocument();
});

test('AccountLogin: Add referrer', async () => {
  const searchParams = new URLSearchParams();
  searchParams.set('referrer', 'groups?sort=-name');
  useSearchParams.mockReturnValue([searchParams]);
  accountService.getAuthURLs.mockReturnValue(
    Promise.resolve({
      google: 'google.url',
      apple: 'apple.url',
    })
  );
  await render(<AccountLogin />);
  expect(screen.getByText('Continue with Google')).toBeInTheDocument();
  expect(screen.getByText('Continue with Google')).toHaveAttribute(
    'href',
    'google.url&state=groups?sort=-name'
  );
  expect(screen.getByText('Continue with Apple')).toBeInTheDocument();
  expect(screen.getByText('Continue with Apple')).toHaveAttribute(
    'href',
    'apple.url&state=groups?sort=-name'
  );
});

test('AccountLogin: Display locale picker', async () => {
  accountService.getAuthURLs.mockReturnValue(
    Promise.resolve({
      google: 'google.url',
      apple: 'apple.url',
    })
  );
  await render(<AccountLogin />);
  expect(screen.getByRole('button', { name: /English/i })).toBeInTheDocument();
});
