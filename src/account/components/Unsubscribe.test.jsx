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

import { render, screen, within } from 'tests/utils';
import React from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import * as terrasoApi from 'terraso-client-shared/terrasoApi/api';

import Unsubscribe from 'account/components/Unsubscribe';

jest.mock('terraso-client-shared/terrasoApi/api');

jest.mock('react-router', () => ({
  ...jest.requireActual('react-router'),
  useNavigate: jest.fn(),
  useSearchParams: jest.fn(),
}));

beforeEach(() => {
  const searchParams = new URLSearchParams();
  searchParams.set('token', '123456');
  useSearchParams.mockReturnValue([searchParams]);
});

const setup = async initialState => {
  await render(<Unsubscribe />, initialState);
};

test('Unsubscribe: success', async () => {
  const navigate = jest.fn();
  useNavigate.mockReturnValue(navigate);

  terrasoApi.requestGraphQL.mockResolvedValue({
    unsubscribeUser: {
      errors: null,
    },
  });

  await setup({
    account: {
      hasToken: true,
      preferences: {},
      unsubscribe: {},
      currentUser: {
        fetching: false,
        data: {
          id: 'user-id',
          firstName: 'John',
          lastName: 'Doe',
          email: 'group@group.org',
          profileImage: '',
        },
      },
    },
  });

  expect(terrasoApi.requestGraphQL).toHaveBeenCalledTimes(2);
  expect(terrasoApi.requestGraphQL.mock.calls[1][1]).toStrictEqual({
    input: {
      token: '123456',
    },
  });

  expect(
    within(screen.getByRole('alert')).getByText(
      /You have been unsubscribed from Terraso emails/i
    )
  ).toBeInTheDocument();

  expect(navigate.mock.calls[0]).toEqual(['/']);
});

test('Unsubscribe: error', async () => {
  const navigate = jest.fn();
  useNavigate.mockReturnValue(navigate);

  terrasoApi.requestGraphQL.mockRejectedValue('error');

  await setup({
    account: {
      hasToken: true,
      preferences: {},
      unsubscribe: {},
      currentUser: {
        fetching: false,
        data: {
          id: 'user-id',
          firstName: 'John',
          lastName: 'Doe',
          email: 'group@group.org',
          profileImage: '',
        },
      },
    },
  });

  expect(terrasoApi.requestGraphQL).toHaveBeenCalledTimes(2);
  expect(terrasoApi.requestGraphQL.mock.calls[1][1]).toStrictEqual({
    input: {
      token: '123456',
    },
  });

  expect(
    within(screen.getByRole('alert')).getByText(
      /Error unsubscribing from Terraso emails/i
    )
  ).toBeInTheDocument();

  expect(navigate.mock.calls[0]).toEqual(['/']);
});
