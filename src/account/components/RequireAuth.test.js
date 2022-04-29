import { render, screen } from 'tests/utils';

import React from 'react';

import _ from 'lodash/fp';
import { useLocation, useParams } from 'react-router-dom';

import { getUserEmail } from 'account/auth';
import RequireAuth from 'account/components/RequireAuth';
import GroupView from 'group/components/GroupView';
import * as terrasoApi from 'terrasoBackend/api';

jest.mock('terrasoBackend/api');

jest.mock('account/auth', () => ({
  ...jest.requireActual('account/auth'),
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
  terrasoApi.request.mockRejectedValueOnce('UNAUTHENTICATED');
  global.fetch.mockResolvedValueOnce({
    status: 401,
  });
  global.fetch.mockResolvedValueOnce({
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

  expect(global.fetch).toHaveBeenCalledTimes(2);
  expect(terrasoApi.request).toHaveBeenCalledTimes(1);
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
  terrasoApi.request
    .mockRejectedValueOnce('UNAUTHENTICATED')
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

  expect(screen.getByText('Group not found')).toBeInTheDocument();
});
test('Auth: test fetch user', async () => {
  getUserEmail.mockReturnValue(Promise.resolve('test@email.com'));
  terrasoApi.request.mockReturnValue(
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

  expect(terrasoApi.request).toHaveBeenCalledTimes(1);
});
