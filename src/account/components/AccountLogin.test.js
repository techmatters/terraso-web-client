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
import { useNavigate, useSearchParams } from 'react-router';
import * as accountService from 'terraso-client-shared/account/accountService';

import AccountLogin from 'account/components/AccountLogin';

jest.mock('terraso-client-shared/account/accountService');

jest.mock('react-router', () => ({
  ...jest.requireActual('react-router'),
  useSearchParams: jest.fn(),
  useNavigate: jest.fn(),
}));

beforeEach(() => {
  useSearchParams.mockReturnValue([new URLSearchParams(), () => {}]);
  useNavigate.mockReturnValue(jest.fn());
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
      google: 'google.url?param=value',
      apple: 'apple.url?param=value',
    })
  );
  await render(<AccountLogin />);
  expect(screen.getByText('Sign in with Google')).toBeInTheDocument();
  expect(screen.getByText('Sign in with Google')).toHaveAttribute(
    'href',
    `google.url?param=value`
  );
  expect(screen.getByText('Sign in with Apple')).toBeInTheDocument();
});

test('AccountLogin: Add referrer', async () => {
  const searchParams = new URLSearchParams();
  const referrer = encodeURIComponent('groups?sort=-name&other=1');
  searchParams.set('referrer', referrer);
  useSearchParams.mockReturnValue([searchParams]);
  accountService.getAuthURLs.mockReturnValue(
    Promise.resolve({
      google: 'google.url?param=value',
      apple: 'apple.url?param=value',
    })
  );
  await render(<AccountLogin />);
  expect(screen.getByText('Sign in with Google')).toBeInTheDocument();
  const state = `account%3FreferrerBase64%3D${btoa(referrer)}`;
  expect(screen.getByText('Sign in with Google')).toHaveAttribute(
    'href',
    `google.url?param=value&state=${state}`
  );
  expect(screen.getByText('Sign in with Apple')).toBeInTheDocument();
  expect(screen.getByText('Sign in with Apple')).toHaveAttribute(
    'href',
    `apple.url?param=value&state=${state}`
  );
});

test('AccountLogin: Navigate to referrer if logged in', async () => {
  accountService.getAuthURLs.mockReturnValue(
    Promise.resolve({
      google: 'google.url',
      apple: 'apple.url',
    })
  );
  const navigate = jest.fn();
  useNavigate.mockReturnValue(navigate);
  const searchParams = new URLSearchParams();
  const referrer = encodeURIComponent('groups?sort=-name&other=1');
  searchParams.set('referrer', referrer);
  useSearchParams.mockReturnValue([searchParams]);
  await render(<AccountLogin />, {
    account: {
      hasToken: true,
      login: {},
      currentUser: {
        data: {
          email: 'test@test.com',
        },
      },
    },
  });
  expect(navigate).toHaveBeenCalledWith('groups?sort=-name&other=1', {
    replace: true,
  });
});

test('AccountLogin: Navigate to referrer base 64 if logged in', async () => {
  accountService.getAuthURLs.mockReturnValue(
    Promise.resolve({
      google: 'google.url',
      apple: 'apple.url',
    })
  );
  const navigate = jest.fn();
  useNavigate.mockReturnValue(navigate);
  const searchParams = new URLSearchParams();
  const referrer = encodeURIComponent('groups?sort=-name&other=1');
  searchParams.set('referrerBase64', btoa(referrer));
  useSearchParams.mockReturnValue([searchParams]);
  await render(<AccountLogin />, {
    account: {
      hasToken: true,
      login: {},
      currentUser: {
        data: {
          email: 'test@test.com',
        },
      },
    },
  });
  expect(navigate).toHaveBeenCalledWith('groups?sort=-name&other=1', {
    replace: true,
  });
});

test('AccountLogin: Display locale picker', async () => {
  accountService.getAuthURLs.mockReturnValue(
    Promise.resolve({
      google: 'google.url',
      apple: 'apple.url',
    })
  );
  await render(<AccountLogin />);
  expect(
    screen.getByRole('combobox', { name: /English/i })
  ).toBeInTheDocument();
});
