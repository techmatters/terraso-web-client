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
import {
  useLocation,
  useNavigate,
  useParams,
  useSearchParams,
} from 'react-router';
import { getUserEmail } from 'terraso-client-shared/account/auth';
import * as terrasoApi from 'terraso-client-shared/terrasoApi/api';

import RequireAuth from 'account/components/RequireAuth';
import GroupView from 'group/components/GroupView';

jest.mock('terraso-client-shared/terrasoApi/api');

jest.mock('terraso-client-shared/account/auth', () => ({
  ...jest.requireActual('terraso-client-shared/account/auth'),
  getUserEmail: jest.fn(),
}));

jest.mock('react-router', () => ({
  ...jest.requireActual('react-router'),
  useParams: jest.fn(),
  useLocation: jest.fn(),
  useNavigate: jest.fn(),
  useSearchParams: jest.fn(),
  Navigate: props => <div>To: {props.to}</div>,
}));

beforeEach(() => {
  global.fetch = jest.fn();
  useNavigate.mockReturnValue(jest.fn());
  useSearchParams.mockReturnValue([new URLSearchParams(), () => {}]);
});

test('Auth: test redirect', async () => {
  useParams.mockReturnValue({
    slug: 'slug-1',
  });
  useLocation.mockReturnValue({
    pathname: '/groups/slug-1',
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
  expect(
    screen.getByText('To: /account?referrer=%2Fgroups%2Fslug-1')
  ).toBeInTheDocument();
});

const REDIRECT_PATHNAME = '/groups';
const REDIRECT_SEARCH = '?sort=-name&other=1';
const REFERRER_PATH = `/account?referrer=${encodeURIComponent(
  `${REDIRECT_PATHNAME}${REDIRECT_SEARCH}`
)}`;
const REFERRER_URL = new URL(`http://127.0.0.1${REFERRER_PATH}`);

test('Auth: Test url parsing for referrer', async () => {
  expect(REFERRER_URL.searchParams.get('referrer')).toBe(
    '/groups?sort=-name&other=1'
  );
});

test('Auth: Test redirect referrer', async () => {
  useLocation.mockReturnValue({
    pathname: REDIRECT_PATHNAME,
    search: REDIRECT_SEARCH,
  });
  await render(
    <RequireAuth>
      <div />
    </RequireAuth>
  );

  expect(
    screen.getByText(
      'To: /account?referrer=%2Fgroups%3Fsort%3D-name%26other%3D1'
    )
  ).toBeInTheDocument();
});

test('Auth: test refresh tokens', async () => {
  useParams.mockReturnValue({
    slug: 'slug-1',
  });
  useLocation.mockReturnValue({
    pathname: '/groups/slug-1',
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
          preferences: { edges: [] },
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

test('Auth: Redirects to complete profile when firstName missing', async () => {
  const navigate = jest.fn();
  useNavigate.mockReturnValue(navigate);

  await render(
    <RequireAuth>
      <div />
    </RequireAuth>,
    {
      account: {
        currentUser: {
          data: {
            email: 'test@example.com',
            firstName: '',
          },
        },
      },
    }
  );

  expect(navigate).toHaveBeenCalledWith('/account/profile/completeProfile', {
    replace: true,
  });
});

test('Auth: Includes referrer when firstName missing', async () => {
  useLocation.mockReturnValue({
    pathname: REDIRECT_PATHNAME,
    search: REDIRECT_SEARCH,
  });

  const navigate = jest.fn();
  useNavigate.mockReturnValue(navigate);

  await render(
    <RequireAuth>
      <div />
    </RequireAuth>,
    {
      account: {
        currentUser: {
          data: {
            email: 'test@example.com',
            firstName: null,
          },
        },
      },
    }
  );

  expect(navigate).toHaveBeenCalledWith(
    '/account/profile/completeProfile?referrer=%2Fgroups%3Fsort%3D-name%26other%3D1',
    {
      replace: true,
    }
  );
});

test('Auth: Test redirect when fetching is false and no user', async () => {
  await render(
    <RequireAuth>
      <div />
    </RequireAuth>,
    {
      account: {
        hasToken: true,
        currentUser: {
          fetching: false,
          data: null,
        },
      },
    }
  );

  expect(screen.getByText('To: /account')).toBeInTheDocument();
});
