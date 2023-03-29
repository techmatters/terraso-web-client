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

import { useNavigate } from 'react-router-dom';

import Unsubscribe from 'account/components/Unsubscribe';
import * as terrasoApi from 'terrasoBackend/api';

jest.mock('terrasoBackend/api');

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: jest.fn(),
}));

const setup = async initialState => {
  await render(<Unsubscribe />, initialState);
};

test('Unsubscribe: success', async () => {
  const navigate = jest.fn();
  useNavigate.mockReturnValue(navigate);

  terrasoApi.requestGraphQL.mockResolvedValue({
    updateUserPreference: {
      preference: { key: 'notifications', value: 'false' },
      errors: null,
    },
  });

  await setup({
    account: {
      hasToken: true,
      preferences: {},
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
      key: 'notifications',
      userEmail: 'group@group.org',
      value: 'false',
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
      key: 'notifications',
      userEmail: 'group@group.org',
      value: 'false',
    },
  });

  expect(
    within(screen.getByRole('alert')).getByText(
      /Error unsubscribing from Terraso emails/i
    )
  ).toBeInTheDocument();

  expect(navigate.mock.calls[0]).toEqual(['/']);
});
