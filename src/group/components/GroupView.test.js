import React from 'react';
import { act } from 'react-dom/test-utils';
import { useParams } from 'react-router-dom';

import { render, screen } from 'tests/utils';
import GroupView from 'group/components/GroupView';
import * as terrasoApi from 'terrasoBackend/api';

jest.mock('terrasoBackend/api');

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: jest.fn(),
}));

global.fetch = jest.fn();

const setup = async () => {
  await act(async () =>
    render(<GroupView />, {
      account: {
        hasToken: true,
        currentUser: {
          fetching: false,
          data: {
            email: 'email@email.com',
            firstName: 'First',
            lastName: 'Last',
          },
        },
      },
    })
  );
};

beforeEach(() => {
  useParams.mockReturnValue({
    slug: 'slug-1',
  });
});

test('GroupView: Display error', async () => {
  terrasoApi.request.mockRejectedValue(['Load error']);
  await setup();
  expect(screen.getByText(/Load error/i)).toBeInTheDocument();
});
test('GroupForm: Display loader', async () => {
  terrasoApi.request.mockReturnValue(new Promise(() => {}));
  await setup();
  const loader = screen.getByRole('progressbar', { name: '', hidden: true });
  expect(loader).toBeInTheDocument();
});
test('GroupView: Not found', async () => {
  global.fetch.mockReturnValue(
    Promise.resolve({
      json: () => [],
    })
  );
  terrasoApi.request.mockReturnValue(
    Promise.resolve({
      group: null,
    })
  );
  await setup();
  expect(screen.getByText(/Group not found/i)).toBeInTheDocument();
});
test('GroupView: Display data', async () => {
  global.fetch.mockReturnValue(
    Promise.resolve({
      json: () => [],
    })
  );
  const memberships = {
    edges: Array(6)
      .fill(0)
      .map(() => ({
        node: {
          user: {
            firstName: 'Member name',
            lastName: 'Member Last Name',
          },
        },
      })),
  };
  terrasoApi.request.mockReturnValue(
    Promise.resolve({
      groups: {
        edges: [
          {
            node: {
              name: 'Group name',
              description: 'Group description',
              website: 'www.group.org',
              email: 'email@email.com',
              memberships,
            },
          },
        ],
      },
    })
  );
  await setup();

  // Group info
  expect(
    screen.getByRole('heading', { name: 'Group name' })
  ).toBeInTheDocument();
  expect(screen.getByText(/Group description/i)).toBeInTheDocument();
  expect(
    screen.getByRole('link', { name: 'email@email.com' })
  ).toBeInTheDocument();
  expect(
    screen.getByRole('link', { name: 'www.group.org' })
  ).toBeInTheDocument();

  // Members
  expect(
    screen.getByText(
      /6 Terraso members have affiliated themselves with Group name./i
    )
  ).toBeInTheDocument();
  expect(screen.getByText(/\+2/i)).toBeInTheDocument();
  expect(
    screen.getByRole('button', { name: 'Join Group' })
  ).toBeInTheDocument();
});
