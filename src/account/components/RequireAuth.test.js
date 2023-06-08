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
import _ from 'lodash/fp';
import { useLocation, useParams } from 'react-router-dom';
import { getUserEmail } from 'terrasoApi/shared/account/auth';
import * as terrasoApi from 'terrasoApi/shared/terrasoApi/api';
import RequireAuth from 'account/components/RequireAuth';
import GroupView from 'group/components/GroupView';

jest.mock('terrasoApi/shared/terrasoApi/api');

jest.mock('terrasoApi/shared/account/auth', () => ({
  ...jest.requireActual('terrasoApi/shared/account/auth'),
  getUserEmail: jest.fn(),
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: jest.fn(),
  useLocation: jest.fn(),
  Navigate: props => <div>To: {props.to}</div>,
}));

beforeEach(() => {
  global.fetch = jest.fn();
});

test('Auth: test redirect', async () => {
  useParams.mockReturnValue({
    slug: 'slug-1',
  });
  terrasoApi.requestGraphQL
    .mockRejectedValueOnce('UNAUTHENTICATED')
    .mockRejectedValueOnce('UNAUTHENTICATED');
  global.fetch
    .mockResolvedValueOnce({
      status: 401,
    })
    .mockResolvedValueOnce({
      status: 401,
    })
    .mockResolvedValueOnce({
      status: 200,
    })
    .mockResolvedValueOnce({
      status: 200,
    });
  await render(
    <RequireAuth>
      <GroupView />
    </RequireAuth>,
    {
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
    }
  );

  expect(global.fetch).toHaveBeenCalledTimes(4);
  expect(terrasoApi.requestGraphQL).toHaveBeenCalledTimes(2);
  expect(screen.getByText('To: /account')).toBeInTheDocument();
});
test('Auth: test redirect referrer', async () => {
  useLocation.mockReturnValue({
    pathname: '/groups',
    search: '?sort=-name',
  });
  await render(
    <RequireAuth>
      <div />
    </RequireAuth>
  );

  expect(
    screen.getByText('To: /account?referrer=groups?sort=-name')
  ).toBeInTheDocument();
});
test('Auth: test refresh tokens', async () => {
  useParams.mockReturnValue({
    slug: 'slug-1',
  });
  terrasoApi.requestGraphQL
    .mockRejectedValueOnce('UNAUTHENTICATED')
    .mockResolvedValueOnce({})
    .mockResolvedValueOnce({});
  global.fetch.mockResolvedValueOnce({
    status: 200,
    json: () => ({
      atoken: 'auth-token',
      rtoken: 'refresh-token',
    }),
  });
  await render(
    <RequireAuth>
      <GroupView />
    </RequireAuth>,
    {
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
    }
  );
  expect(terrasoApi.requestGraphQL).toHaveBeenCalledTimes(3);

  expect(screen.getByText('Group not found')).toBeInTheDocument();
});
test('Auth: test fetch user', async () => {
  getUserEmail.mockReturnValue(Promise.resolve('test@email.com'));
  terrasoApi.requestGraphQL.mockReturnValue(
    Promise.resolve(
      _.set(
        'users.edges[0].node',
        {
          firstName: 'John',
          lastName: 'Doe',
        },
        {}
      )
    )
  );
  await render(
    <RequireAuth>
      <div />
    </RequireAuth>,
    {
      account: {
        hasToken: true,
        currentUser: {
          fetching: true,
          data: null,
        },
      },
    }
  );

  expect(terrasoApi.requestGraphQL).toHaveBeenCalledTimes(2);
});
