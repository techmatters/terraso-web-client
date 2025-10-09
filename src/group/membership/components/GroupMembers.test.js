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

import { act, fireEvent, render, screen, waitFor, within } from 'tests/utils';
import React from 'react';
import _ from 'lodash/fp';
import { useNavigate, useParams } from 'react-router';
import * as terrasoApi from 'terraso-client-shared/terrasoApi/api';
import { GROUP_TYPES_WITH_REDIRECTS } from 'tests/constants';
import useMediaQuery from '@mui/material/useMediaQuery';

import GroupMembers from 'group/membership/components/GroupMembers';

// Omit console error for DataGrid issue: https://github.com/mui/mui-x/issues/3850
global.console.error = jest.fn();

jest.mock('terraso-client-shared/terrasoApi/api');

jest.mock('@mui/material/useMediaQuery');

jest.mock('react-router', () => ({
  ...jest.requireActual('react-router'),
  useNavigate: jest.fn(),
  useParams: jest.fn(),
}));

const setup = async initialState => {
  await render(<GroupMembers />, {
    account: {
      hasToken: true,
      currentUser: {
        fetching: false,
        data: {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@email.com',
        },
      },
    },
    ...initialState,
  });
};
beforeEach(() => {
  useParams.mockReturnValue({
    slug: 'slug-1',
  });
});

Object.keys(GROUP_TYPES_WITH_REDIRECTS).forEach(currentGroup =>
  test(`GroupMembers: Redirection: ${currentGroup}`, async () => {
    const navigate = jest.fn();
    useNavigate.mockReturnValue(navigate);

    terrasoApi.requestGraphQL.mockReturnValue(
      Promise.resolve(
        _.set(
          'groups.edges[0].node',
          {
            id: 'group-id',
            slug: 'slug-1',
            name: 'Group Name',
            membershipList: {
              membershipType:
                GROUP_TYPES_WITH_REDIRECTS[currentGroup].membershipType,
              accountMembership: {
                userRole: GROUP_TYPES_WITH_REDIRECTS[currentGroup].userRole,
                membershipStatus: 'APPROVED',
              },
            },
          },
          {}
        )
      )
    );

    await setup();

    expect(navigate).toHaveBeenCalledTimes(
      GROUP_TYPES_WITH_REDIRECTS[currentGroup].memberListRedirectCount
    );
  })
);

test('GroupMembers: Display error', async () => {
  terrasoApi.requestGraphQL.mockRejectedValue('Load error');
  await setup();
  expect(terrasoApi.requestGraphQL).toHaveBeenCalledTimes(1);
  expect(screen.getByText(/Load error/i)).toBeInTheDocument();
});
test('GroupMembers: Display loader', async () => {
  terrasoApi.requestGraphQL.mockReturnValue(new Promise(() => {}));
  await setup();
  const loader = screen.getByRole('progressbar', {
    name: 'Loading',
  });
  expect(loader).toBeInTheDocument();
});
test('GroupMembers: Empty', async () => {
  terrasoApi.requestGraphQL.mockReturnValue(
    Promise.resolve(
      _.set(
        'groups.edges[0].node',
        {
          name: 'Group Name',
          membershipList: {
            membershipType: 'OPEN',
          },
        },
        {}
      )
    )
  );
  await setup();
  expect(screen.getByText(/No members/i)).toBeInTheDocument();
});
test('GroupMembers: Display list', async () => {
  const generateMemberhips = (index, count) => ({
    edges: Array(count)
      .fill(0)
      .map((i, index) =>
        _.flow(
          _.set('node.user', {
            id: `index-${index}`,
            firstName: 'First name',
            lastName: 'Last Name',
            email:
              index === 0 ? 'john.doe@email.com' : `email${index}@email.com`,
          }),
          _.set('node.userRole', 'member'),
          _.set('node.id', `membership-${index}`),
          _.set('node.membershipStatus', 'APPROVED')
        )({})
      ),
  });

  const group = {
    slug: 'test-group-slug',
    name: 'Group Name',
    membershipList: {
      membershipType: 'OPEN',
      memberships: generateMemberhips(3, 20),
    },
  };

  terrasoApi.requestGraphQL.mockReturnValue(
    Promise.resolve(_.set('groups.edges[0].node', group, {}))
  );
  await setup();

  // Group info
  expect(
    screen.getByRole('heading', { name: 'Group Name Members' })
  ).toBeInTheDocument();
  const rows = screen.getAllByRole('row');
  expect(rows.length).toBe(16); // 15 displayed + header
  expect(
    within(rows[2]).getByRole('gridcell', {
      name: 'First name Last Name',
    })
  ).toHaveAttribute('data-field', 'name');
  expect(
    within(rows[9]).queryByRole('button', { name: 'Member' })
  ).not.toBeInTheDocument();
  expect(
    within(rows[9]).getByText('Member').closest('[role="gridcell"]')
  ).toHaveAttribute('data-field', 'role');
  expect(within(rows[2]).queryByRole('button')).not.toBeInTheDocument();
  expect(
    within(rows[1])
      .getByRole('button', { name: 'Leave: Group Name' })
      .closest('[role="gridcell"]')
  ).toHaveAttribute('data-field', 'actions');
});
test('GroupMembers: Display list (small)', async () => {
  useMediaQuery.mockReturnValue(true);
  const generateMemberhips = (index, count) => ({
    edges: Array(count)
      .fill(0)
      .map((i, index) =>
        _.flow(
          _.set('node.user', {
            id: `index-${index}`,
            firstName: 'Member name',
            lastName: 'Member Last Name',
            email:
              index === 0 ? 'john.doe@email.com' : `email${index}@email.com`,
          }),
          _.set('node.userRole', 'member'),
          _.set('node.id', `membership-${index}`),
          _.set('node.membershipStatus', 'APPROVED')
        )({})
      ),
  });

  const group = {
    slug: 'test-group-slug',
    name: 'Group Name',
    membershipList: {
      membershipType: 'OPEN',
      memberships: generateMemberhips(3, 20),
    },
  };

  terrasoApi.requestGraphQL.mockReturnValue(
    Promise.resolve(_.set('groups.edges[0].node', group, {}))
  );
  await setup();

  // Group info
  expect(
    screen.getByRole('heading', { name: 'Group Name Members' })
  ).toBeInTheDocument();
  const rows = screen.getAllByRole('listitem');
  expect(rows.length).toBe(20);
  expect(
    within(rows[1]).getByText('Member name Member Last Name')
  ).toBeInTheDocument();
  expect(within(rows[8]).getByText('Member')).toBeInTheDocument();
  expect(within(rows[0]).getByText('Member')).toBeInTheDocument();
});
test('GroupMembers: Display list manager', async () => {
  const generateMemberhips = (index, count) => ({
    edges: Array(count)
      .fill(0)
      .map((i, index) =>
        _.flow(
          _.set('node.user', {
            id: `index-${index}`,
            firstName: 'Member name',
            lastName: 'Member Last Name',
            email: 'email@email.com',
          }),
          _.set('node.userRole', 'member'),
          _.set('node.id', `membership-${index}`),
          _.set('node.membershipStatus', 'APPROVED')
        )({})
      ),
  });

  const group = {
    slug: 'test-group-slug',
    name: 'Group Name',
    membershipList: {
      memberships: generateMemberhips(3, 57),
      accountMembership: { userRole: 'manager', membershipStatus: 'APPROVED' },
    },
  };

  terrasoApi.requestGraphQL.mockReturnValue(
    Promise.resolve(_.set('groups.edges[0].node', group, {}))
  );
  await setup();

  // Group info
  expect(
    screen.getByRole('heading', { name: 'Manage Members' })
  ).toBeInTheDocument();
  const rows = screen.getAllByRole('row');
  expect(rows.length).toBe(16); // 15 displayed + header
  expect(
    within(rows[2]).getByRole('gridcell', {
      name: 'Member name Member Last Name',
    })
  ).toHaveAttribute('data-field', 'name');
  expect(
    within(rows[9])
      .getByRole('combobox', { name: 'Role' })
      .closest('[role="gridcell"]')
  ).toHaveAttribute('data-field', 'role');
  expect(
    within(rows[9]).getByRole('combobox', { name: 'Role' })
  ).toHaveTextContent('Member');
  expect(
    within(rows[2])
      .getByRole('button', { name: 'Remove' })
      .closest('[role="gridcell"]')
  ).toHaveAttribute('data-field', 'actions');
});
test('GroupMembers: Manager actions', async () => {
  const generateUser = index => ({
    id: `index-${index}`,
    firstName: `Member name ${index}`,
    lastName: `Member Last Name ${index}`,
    email: `email${index}@email.com`,
  });
  const generateMemberhips = (index, count) => ({
    edges: [
      ...Array(count)
        .fill(0)
        .map((i, index) =>
          _.flow(
            _.set('node.user', generateUser(index)),
            _.set('node.userRole', 'member'),
            _.set('node.id', `membership-${index}`),
            _.set('node.membershipStatus', 'APPROVED')
          )({})
        ),
    ],
  });

  const baseGroup = {
    slug: 'test-group-slug',
    name: 'Group Name',
    membershipList: {
      memberships: generateMemberhips(3, 3),
      accountMembership: { userRole: 'manager', membershipStatus: 'APPROVED' },
    },
  };

  terrasoApi.requestGraphQL.mockImplementation(query => {
    const trimmedQuery = query.trim();
    if (trimmedQuery.startsWith('query group')) {
      return Promise.resolve(_.set('groups.edges[0].node', baseGroup, {}));
    }
    if (trimmedQuery.startsWith('mutation changeGroupMemberRole')) {
      return Promise.resolve(
        _.flow(
          _.set('saveGroupMembership.group', baseGroup),
          _.set('saveGroupMembership.memberships[0]', {
            userRole: 'manager',
            membershipStatus: 'APPROVED',
            id: 'membership-2',
            user: generateUser(2),
          })
        )({})
      );
    }
    if (trimmedQuery.startsWith('mutation removeGroupMember')) {
      return Promise.resolve(
        _.set(
          'deleteGroupMembership.membership',
          baseGroup.membershipList.memberships.edges.slice(0, -1),
          {}
        )
      );
    }
  });
  await setup();

  expect(terrasoApi.requestGraphQL).toHaveBeenCalledWith(
    expect.stringContaining('query group'),
    { slug: 'slug-1' }
  );

  // Group info
  expect(
    screen.getByRole('heading', { name: 'Manage Members' })
  ).toBeInTheDocument();
  const rows = screen.getAllByRole('row');

  // Role Change
  expect(
    within(rows[3]).getByRole('gridcell', {
      name: 'Member name 2 Member Last Name 2',
    })
  ).toHaveAttribute('data-field', 'name');
  expect(
    within(rows[3])
      .getByRole('combobox', { name: 'Role' })
      .closest('[role="gridcell"]')
  ).toHaveAttribute('data-field', 'role');
  const roleButton = within(rows[3]).getByRole('combobox', { name: 'Role' });
  expect(within(roleButton).getByText('Member')).toBeInTheDocument();
  await act(async () => fireEvent.mouseDown(roleButton));
  expect(screen.getByRole('option', { name: 'Manager' })).toBeInTheDocument();
  await act(
    async () =>
      await fireEvent.click(screen.getByRole('option', { name: 'Manager' }))
  );
  expect(terrasoApi.requestGraphQL).toHaveBeenCalledWith(
    expect.stringContaining('mutation changeGroupMemberRole'),
    {
      input: {
        userEmails: ['email2@email.com'],
        groupSlug: 'test-group-slug',
        userRole: 'manager',
        membershipStatus: 'APPROVED',
      },
    }
  );

  expect(
    within(screen.getAllByRole('row')[3]).getByRole('gridcell', {
      name: 'Member name 2 Member Last Name 2',
    })
  ).toHaveAttribute('data-field', 'name');
  await waitFor(() =>
    expect(
      within(screen.getAllByRole('row')[3])
        .getByRole('combobox', {
          name: 'Role',
        })
        .closest('[role="gridcell"]')
    ).toHaveAttribute('data-field', 'role')
  );
  expect(
    within(screen.getAllByRole('row')[3]).getByRole('combobox', {
      name: 'Role',
    })
  ).toHaveTextContent('Manager');

  // Remove member
  expect(rows.length).toBe(4);
  const removeButton = within(rows[3]).getByRole('button', { name: 'Remove' });
  await act(async () => fireEvent.click(removeButton));
  await act(
    async () =>
      await fireEvent.click(
        screen.getByRole('button', { name: 'Remove Member' })
      )
  );
  await screen.findByRole('region', {
    name: 'Current Members',
  });

  expect(terrasoApi.requestGraphQL).toHaveBeenCalledWith(
    expect.stringContaining('mutation removeGroupMember'),
    {
      input: {
        groupSlug: 'test-group-slug',
        id: 'membership-2',
      },
    }
  );

  await waitFor(() => expect(screen.getAllByRole('row').length).toBe(3));
  const removedRows = screen.getAllByRole('row');
  expect(removedRows.length).toBe(3);
});
test('GroupMembers: Closed group manager actions', async () => {
  const generateUser = index => ({
    id: `index-${index}`,
    firstName: `Pending Member name ${index}`,
    lastName: `Pending Member Last Name ${index}`,
    email: `email${index}@email.com`,
  });
  const generateMemberhips = (index, count) => ({
    edges: [
      ...Array(count)
        .fill(0)
        .map((i, index) =>
          _.flow(
            _.set('node.user', generateUser(index)),
            _.set('node.userRole', 'member'),
            _.set('node.id', `membership-pending-${index}`),
            _.set('node.membershipStatus', 'PENDING')
          )({})
        ),
    ],
  });

  const baseGroup = {
    slug: 'test-group-slug',
    name: 'Group Name',
    membershipList: {
      memberships: generateMemberhips(3, 3),
      accountMembership: { userRole: 'manager', membershipStatus: 'APPROVED' },
    },
  };

  terrasoApi.requestGraphQL.mockImplementation(query => {
    const trimmedQuery = query.trim();
    if (trimmedQuery.startsWith('query group')) {
      return Promise.resolve(_.set('groups.edges[0].node', baseGroup, {}));
    }
    if (trimmedQuery.startsWith('mutation changeGroupMemberRole')) {
      return Promise.resolve(
        _.set(
          'saveGroupMembership.memberships[0]',
          {
            id: 'membership-pending-1',
            membershipStatus: 'APPROVED',
            userRole: 'member',
            user: generateUser(1),
          },
          {}
        )
      );
    }
    if (trimmedQuery.startsWith('mutation removeGroupMember')) {
      return Promise.resolve(
        _.set(
          'deleteGroupMembership.membership',
          baseGroup.membershipList.memberships.edges
            .map(member =>
              member.node.id === 'membership-pending-0' ? null : member
            )
            .filter(member => member),
          {}
        )
      );
    }
  });
  await setup();

  expect(terrasoApi.requestGraphQL).toHaveBeenCalledWith(
    expect.stringContaining('query group'),
    { slug: 'slug-1' }
  );

  // Group info
  await screen.findByRole('heading', { name: 'Manage Members' });

  // Pending members
  const pendingSection = within(
    screen.getByRole('region', {
      name: 'Pending Members',
    })
  );
  expect(pendingSection.getAllByRole('listitem').length).toBe(3);

  // Reject
  expect(
    within(pendingSection.getAllByRole('listitem')[0]).getByText(
      'Pending Member name 0 Pending Member Last Name 0'
    )
  ).toBeInTheDocument();
  await act(
    async () =>
      await fireEvent.click(
        within(pendingSection.getAllByRole('listitem')[0]).getByRole('button', {
          name: 'Reject',
        })
      )
  );
  await act(
    async () =>
      await fireEvent.click(
        screen.getByRole('button', { name: 'Reject Request' })
      )
  );
  await waitFor(() =>
    expect(pendingSection.getAllByRole('listitem').length).toBe(2)
  );
  expect(terrasoApi.requestGraphQL).toHaveBeenCalledWith(
    expect.stringContaining('mutation removeGroupMember'),
    {
      input: {
        groupSlug: 'test-group-slug',
        id: 'membership-pending-0',
      },
    }
  );

  // Approve
  expect(
    within(pendingSection.getAllByRole('listitem')[0]).getByText(
      'Pending Member name 1 Pending Member Last Name 1'
    )
  ).toBeInTheDocument();
  await act(
    async () =>
      await fireEvent.click(
        within(pendingSection.getAllByRole('listitem')[0]).getByRole('button', {
          name: 'Approve',
        })
      )
  );
  expect(terrasoApi.requestGraphQL).toHaveBeenCalledWith(
    expect.stringContaining('mutation changeGroupMemberRole'),
    {
      input: {
        groupSlug: 'test-group-slug',
        userEmails: ['email1@email.com'],
        membershipStatus: 'APPROVED',
      },
    }
  );

  expect(pendingSection.getAllByRole('listitem').length).toBe(1);
  expect(
    within(
      screen.getByRole('region', {
        name: 'Pending Members',
      })
    ).getByRole('listitem', {
      name: 'Pending Member name 2 Pending Member Last Name 2',
    })
  ).toBeInTheDocument();
  expect(
    pendingSection.getByText('Pending Member name 2 Pending Member Last Name 2')
  ).toBeInTheDocument();
  const listSection = screen.getByRole('region', {
    name: 'Current Members',
  });
  await waitFor(() =>
    expect(within(listSection).getAllByRole('row').length).toBe(2)
  );
});
