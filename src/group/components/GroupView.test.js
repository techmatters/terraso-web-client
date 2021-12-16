import React from 'react';
import { act } from 'react-dom/test-utils';
import { useParams } from 'react-router-dom';

import { render, screen } from 'tests/utils';
import GroupView from 'group/components/GroupView';
import * as terrasoApi from 'terrasoBackend/api';

jest.mock('terrasoBackend/api');

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: jest.fn()
}));

global.fetch = jest.fn();

beforeEach(() => {
  useParams.mockReturnValue({
    slug: 'slug-1'
  });
});

test('GroupView: Display error', async () => {
  terrasoApi.request.mockRejectedValue(['Load error']);
  await act(async () => render(<GroupView />));
  expect(screen.getByText(/Load error/i)).toBeInTheDocument();
});
test('GroupForm: Display loader', () => {
  terrasoApi.request.mockReturnValue(new Promise(() => {}));
  render(<GroupView />);
  const loader = screen.getByRole('progressbar', { name: '', hidden: true });
  expect(loader).toBeInTheDocument();
});
test('GroupView: Not found', async () => {
  global.fetch.mockReturnValue(Promise.resolve({
    json: () => ([])
  }));
  terrasoApi.request.mockReturnValue(Promise.resolve({
    group: null
  }));
  await act(async () => render(<GroupView />));
  expect(screen.getByText(/Group not found/i)).toBeInTheDocument();
});
test('GroupView: Display data', async () => {
  global.fetch.mockReturnValue(Promise.resolve({
    json: () => ([])
  }));
  const memberships = {
    edges: Array(6).fill(0).map(() => ({
      node: {
        user: {
          firstName: 'Member name',
          lastName: 'Member Last Name'
        }
      }
    }))
  };
  terrasoApi.request.mockReturnValue(Promise.resolve({
    groups: {
      edges: [{
        node: {
          name: 'Group Name',
          description: 'Group Description',
          website: 'www.group.org',
          email: 'email@email.com',
          memberships
        }
      }]
    }
  }));
  await act(async () => render(<GroupView />));

  // Group info
  expect(screen.getByRole('heading', { name: 'Group Name' })).toBeInTheDocument();
  expect(screen.getByText(/Group Description/i)).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'email@email.com' })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'www.group.org' })).toBeInTheDocument();

  // Members
  expect(screen.getByText(/6 Group Name members have created accounts in Terraso./i)).toBeInTheDocument();
  expect(screen.getByText(/\+2/i)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Join Group' })).toBeInTheDocument();
});
