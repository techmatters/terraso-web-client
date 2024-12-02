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

import { act, fireEvent, render, screen, within } from 'tests/utils';
import React from 'react';
import { when } from 'jest-when';
import { useParams } from 'react-router';
import * as terrasoApi from 'terraso-client-shared/terrasoApi/api';

import GroupView from 'group/components/GroupView';

jest.mock('terraso-client-shared/terrasoApi/api');

jest.mock('react-router', () => ({
  ...jest.requireActual('react-router'),
  useParams: jest.fn(),
}));

global.fetch = jest.fn();

const setup = async () => {
  await render(<GroupView />, {
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
  });
};

beforeEach(() => {
  useParams.mockReturnValue({
    slug: 'slug-1',
  });
  Object.assign(navigator, {
    clipboard: {
      writeText: jest.fn(),
    },
  });
});

test('GroupView: Display error', async () => {
  terrasoApi.requestGraphQL.mockRejectedValue(['Load error']);
  await setup();
  expect(screen.getByText(/Load error/i)).toBeInTheDocument();
});
test('GroupForm: Display loader', async () => {
  terrasoApi.requestGraphQL.mockReturnValue(new Promise(() => {}));
  await setup();
  const loader = screen.getByRole('progressbar', {
    name: 'Loading',
  });
  expect(loader).toBeInTheDocument();
});
test('GroupView: Not found', async () => {
  global.fetch.mockReturnValue(
    Promise.resolve({
      json: () => [],
    })
  );
  terrasoApi.requestGraphQL.mockReturnValue(
    Promise.resolve({
      group: null,
    })
  );
  await setup();
  expect(screen.getByText(/Group not found/i)).toBeInTheDocument();
});

const groupViewMemberBase = async (
  accountMembership = {
    id: 'user-id',
    userRole: 'member',
    membershipStatus: 'APPROVED',
    user: {
      firstName: 'Member First Name',
      lastName: 'Member Last Name',
    },
  }
) => {
  global.fetch.mockReturnValue(
    Promise.resolve({
      json: () => [],
    })
  );
  const memberships = {
    totalCount: 6,
    edges: Array(5)
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

  const sharedResources = {
    edges: Array(6)
      .fill(0)
      .map((item, index) => ({
        node: {
          id: `shared-resource-id-${index}`,
          shareAccess: 'MEMBERS',
          shareUrl: 'https://example.com',
          source: {
            id: `de-${index}`,
            createdAt: '2022-05-20T16:25:21.536679+00:00',
            name: `Data Entry ${index}`,
            createdBy: { id: 'user-id', firstName: 'First', lastName: 'Last' },
            description: `Description ${index}`,
            size: 3456,
            entryType: 'FILE',
            visualizations: { edges: [] },
          },
        },
      })),
  };
  const group = {
    name: 'Group name',
    description: 'Group description',
    website: 'https://www.group.org',
    email: 'email@email.com',
    membershipList: {
      memberships,
      accountMembership,
    },
    sharedResources,
  };
  when(terrasoApi.requestGraphQL)
    .calledWith(expect.stringContaining('query groupToView'), expect.anything())
    .mockReturnValue(
      Promise.resolve({
        groups: {
          edges: [
            {
              node: group,
            },
          ],
        },
      })
    );
  when(terrasoApi.requestGraphQL)
    .calledWith(
      expect.stringContaining('mutation joinGroup'),
      expect.anything()
    )
    .mockResolvedValue({
      saveGroupMembership: {
        group: {
          ...group,
          membershipList: {
            ...group.membershipList,
            accountMembership: {
              id: 'user-id',
              userRole: 'member',
              membershipStatus: 'APPROVED',
              user: {
                firstName: 'Member First Name',
                lastName: 'Member Last Name',
              },
            },
          },
        },
      },
    });
  await setup();
};

test('GroupView: Display data', async () => {
  await groupViewMemberBase();

  // Group info
  expect(
    screen.getByRole('heading', { name: 'Group name' })
  ).toBeInTheDocument();
  expect(screen.getByText(/Group description/i)).toBeInTheDocument();
  expect(
    screen.getByRole('link', { name: 'email@email.com' })
  ).toBeInTheDocument();
  expect(
    screen.getByRole('link', { name: 'https://www.group.org' })
  ).toBeInTheDocument();

  // Members
  expect(
    screen.getByText(/6 Terraso members joined Group name./i)
  ).toBeInTheDocument();
  expect(screen.getByText(/\+2/i)).toBeInTheDocument();
  expect(
    screen.getByRole('button', { name: 'Leave: Group name' })
  ).toBeInTheDocument();

  // Shared Data
  const sharedDataRegion = within(
    screen.getByRole('region', { name: 'Shared files and Links' })
  );
  expect(
    sharedDataRegion.getByRole('heading', { name: 'Shared files and Links' })
  ).toBeInTheDocument();
  const entriesList = within(sharedDataRegion.getByRole('list'));
  const items = entriesList.getAllByRole('listitem');
  expect(items.length).toBe(6);
});
test('GroupView: Share link manager', async () => {
  when(terrasoApi.requestGraphQL)
    .calledWith(
      expect.stringContaining('mutation updateSharedResource'),
      expect.anything()
    )
    .mockResolvedValue({
      updateSharedResource: {
        sharedResource: {
          id: `shared-resource-id-0`,
          shareAccess: 'ALL',
          shareUrl: 'https://example.com',
          source: {
            id: `de-0`,
            createdAt: '2022-05-20T16:25:21.536679+00:00',
            name: `Data Entry 0`,
            createdBy: { id: 'user-id', firstName: 'First', lastName: 'Last' },
            description: `Description 0`,
            size: 3456,
            entryType: 'FILE',
            visualizations: { edges: [] },
          },
        },
        errors: null,
      },
    });

  await groupViewMemberBase({
    id: 'user-id',
    userRole: 'manager',
    membershipStatus: 'APPROVED',
    user: {
      firstName: 'Member First Name',
      lastName: 'Member Last Name',
    },
  });

  const sharedDataRegion = within(
    screen.getByRole('region', { name: 'Shared files and Links' })
  );
  expect(
    sharedDataRegion.getByRole('heading', { name: 'Shared files and Links' })
  ).toBeInTheDocument();
  const entriesList = within(sharedDataRegion.getByRole('list'));
  const items = entriesList.getAllByRole('listitem');
  expect(items.length).toBe(6);

  const shareButton = within(items[0]).getByRole('button', {
    name: 'Share File “Data Entry 0”',
  });
  await act(async () => fireEvent.click(shareButton));

  const dialog = screen.getByRole('dialog', {
    name: 'Share “Data Entry 0” File',
  });

  // Access level
  const shareAccess = within(dialog).getByRole('combobox', {
    name: `Share access level`,
  });
  await act(async () => fireEvent.mouseDown(shareAccess));
  const listbox = within(screen.getByRole('listbox'));
  await act(async () =>
    fireEvent.click(listbox.getByRole('option', { name: 'Anyone with link' }))
  );

  expect(terrasoApi.requestGraphQL).toHaveBeenCalledWith(
    expect.stringContaining('mutation updateSharedResource'),
    {
      input: {
        id: 'shared-resource-id-0',
        shareAccess: 'ALL',
      },
    }
  );

  // Copy link
  await act(async () =>
    fireEvent.click(within(dialog).getByRole('button', { name: 'Copy Link' }))
  );
  const copyCall = navigator.clipboard.writeText.mock.calls[0];
  expect(copyCall[0].toString()).toStrictEqual('https://example.com');
});

test('GroupView: Share link member', async () => {
  await groupViewMemberBase();

  const sharedDataRegion = within(
    screen.getByRole('region', { name: 'Shared files and Links' })
  );
  expect(
    sharedDataRegion.getByRole('heading', { name: 'Shared files and Links' })
  ).toBeInTheDocument();
  const entriesList = within(sharedDataRegion.getByRole('list'));
  const items = entriesList.getAllByRole('listitem');

  const shareButton = within(items[0]).getByRole('button', {
    name: 'Share File “Data Entry 0”',
  });
  await act(async () => fireEvent.click(shareButton));

  const dialog = screen.getByRole('dialog', {
    name: 'Share “Data Entry 0” File',
  });

  expect(
    within(dialog).getByText(/Members can view and download this file/i)
  ).toBeInTheDocument();

  // Copy link
  await act(async () =>
    fireEvent.click(within(dialog).getByRole('button', { name: 'Copy Link' }))
  );
  const copyCall = navigator.clipboard.writeText.mock.calls[0];
  expect(copyCall[0].toString()).toStrictEqual('https://example.com');
});
test('GroupView: Display shared data after join', async () => {
  await groupViewMemberBase({ accountMembership: null });

  // Group info
  expect(
    screen.getByRole('heading', { name: 'Group name' })
  ).toBeInTheDocument();
  expect(screen.getByText(/Group description/i)).toBeInTheDocument();
  expect(
    screen.getByRole('link', { name: 'email@email.com' })
  ).toBeInTheDocument();
  expect(
    screen.getByRole('link', { name: 'https://www.group.org' })
  ).toBeInTheDocument();

  // Members
  expect(
    screen.getByText(/6 Terraso members joined Group name./i)
  ).toBeInTheDocument();
  expect(screen.getByText(/\+2/i)).toBeInTheDocument();
  const joinButton = screen.getByRole('button', { name: 'Join Group' });
  await act(async () => fireEvent.click(joinButton));

  // Shared Data
  const sharedDataRegion = within(
    screen.getByRole('region', { name: 'Shared files and Links' })
  );
  expect(
    sharedDataRegion.getByRole('heading', { name: 'Shared files and Links' })
  ).toBeInTheDocument();
  const entriesList = within(sharedDataRegion.getByRole('list'));
  const items = entriesList.getAllByRole('listitem');
  expect(items.length).toBe(6);
});
