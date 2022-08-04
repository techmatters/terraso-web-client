import { fireEvent, render, screen, waitFor, within } from 'tests/utils';

import React from 'react';

import _ from 'lodash/fp';
import { act } from 'react-dom/test-utils';

import useMediaQuery from '@mui/material/useMediaQuery';

import GroupMembers from 'group/membership/components/GroupMembers';
import * as terrasoApi from 'terrasoBackend/api';

// Omit console error for DataGrid issue: https://github.com/mui/mui-x/issues/3850
global.console.error = jest.fn();

jest.mock('terrasoBackend/api');

jest.mock('@mui/material/useMediaQuery');

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
    hidden: true,
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
    memberships: generateMemberhips(3, 20),
  };

  terrasoApi.requestGraphQL
    .mockReturnValueOnce(
      Promise.resolve(_.set('groups.edges[0].node', group, {}))
    )
    .mockReturnValueOnce(
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
    within(rows[2]).getByRole('cell', {
      name: 'Member name Member Last Name',
    })
  ).toHaveAttribute('data-field', 'name');
  expect(
    within(rows[9]).queryByRole('button', { name: 'Member' })
  ).not.toBeInTheDocument();
  expect(within(rows[9]).getByRole('cell', { name: 'Member' })).toHaveAttribute(
    'data-field',
    'role'
  );
  expect(within(rows[2]).getByRole('cell', { name: '' })).toHaveAttribute(
    'data-field',
    'actions'
  );
  expect(within(rows[1]).getByRole('cell', { name: 'Leave' })).toHaveAttribute(
    'data-field',
    'actions'
  );
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
    memberships: generateMemberhips(3, 20),
  };

  terrasoApi.requestGraphQL
    .mockReturnValueOnce(
      Promise.resolve(_.set('groups.edges[0].node', group, {}))
    )
    .mockReturnValueOnce(
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
          _.set('node.userRole', 'MEMBER'),
          _.set('node.id', `membership-${index}`),
          _.set('node.membershipStatus', 'APPROVED')
        )({})
      ),
  });

  const group = {
    slug: 'test-group-slug',
    name: 'Group Name',
    memberships: generateMemberhips(3, 57),
    accountMembership: _.set(
      'edges[0].node',
      { userRole: 'MANAGER', membershipStatus: 'APPROVED' },
      {}
    ),
  };

  terrasoApi.requestGraphQL
    .mockReturnValueOnce(
      Promise.resolve(_.set('groups.edges[0].node', group, {}))
    )
    .mockReturnValueOnce(
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
    within(rows[2]).getByRole('cell', {
      name: 'Member name Member Last Name',
    })
  ).toHaveAttribute('data-field', 'name');
  expect(within(rows[9]).getByRole('cell', { name: 'Member' })).toHaveAttribute(
    'data-field',
    'role'
  );
  expect(
    within(rows[9]).getByRole('button', { name: 'Member' })
  ).toBeInTheDocument();
  expect(within(rows[2]).getByRole('cell', { name: 'Remove' })).toHaveAttribute(
    'data-field',
    'actions'
  );
});
test('GroupMembers: Manager actions', async () => {
  const generateMemberhips = (approved, pending) => ({
    edges: [
      ...Array(approved)
        .fill(0)
        .map((i, index) =>
          _.flow(
            _.set('node.user', {
              id: `index-approved-${index}`,
              firstName: `Member name ${index}`,
              lastName: 'Member Last Name',
              email: 'email@email.com',
            }),
            _.set('node.userRole', 'MEMBER'),
            _.set('node.id', `membership-approved-${index}`),
            _.set('node.membershipStatus', 'APPROVED')
          )({})
        ),
      ...Array(pending)
        .fill(0)
        .map((i, index) =>
          _.flow(
            _.set('node.user', {
              id: `index-pending-${index}`,
              firstName: `Member name Pending ${index}`,
              lastName: 'Member Last Name',
              email: 'email@email.com',
            }),
            _.set('node.userRole', 'MEMBER'),
            _.set('node.id', `membership-pending-${index}`),
            _.set('node.membershipStatus', 'PENDING')
          )({})
        ),
    ],
  });

  const group = {
    slug: 'test-group-slug',
    name: 'Group Name',
    memberships: generateMemberhips(3, 2),
    accountMembership: _.set(
      'edges[0].node',
      { userRole: 'MANAGER', membershipStatus: 'APPROVED' },
      {}
    ),
  };

  terrasoApi.requestGraphQL
    .mockReturnValueOnce(
      Promise.resolve(_.set('groups.edges[0].node', group, {}))
    )
    .mockReturnValueOnce(
      Promise.resolve(_.set('groups.edges[0].node', group, {}))
    )
    .mockReturnValueOnce(
      Promise.resolve(
        _.flow(
          _.set('updateMembership.membership.group', group),
          _.set(
            'updateMembership.membership.group.memberships.edges[2].node.userRole',
            'MANAGER'
          ),
          _.set(
            'updateMembership.membership.group.memberships.edges[2].node.id',
            'membership-approved-2'
          )
        )({})
      )
    )
    .mockReturnValueOnce(
      Promise.resolve(
        _.flow(
          _.set('deleteMembership.membership.group', group),
          _.set(
            'deleteMembership.membership.group.memberships.edges',
            group.memberships.edges
              .map(member =>
                member.node.id === 'membership-approved-2' ? null : member
              )
              .filter(member => member)
          )
        )({})
      )
    )
    .mockReturnValueOnce(
      Promise.resolve(
        _.flow(
          _.set('deleteMembership.membership.group', group),
          _.set(
            'deleteMembership.membership.group.memberships.edges',
            group.memberships.edges
              .map(member =>
                member.node.id === 'membership-pending-0' ? null : member
              )
              .filter(member => member)
          )
        )({})
      )
    )
    .mockReturnValueOnce(
      Promise.resolve(
        _.flow(
          _.set('updateMembership.membership.group', group),
          _.set(
            'updateMembership.membership.group.memberships.edges[4].node.membershipStatus',
            'APPROVED'
          )
        )({})
      )
    );

  await setup();

  // Group info
  expect(
    screen.getByRole('heading', { name: 'Manage Members' })
  ).toBeInTheDocument();
  const listSection = screen.getByRole('region', {
    name: 'Current Members',
  });
  const rows = within(listSection).getAllByRole('row');

  expect(
    within(rows[3]).getByRole('cell', {
      name: 'Member name 2 Member Last Name',
    })
  ).toHaveAttribute('data-field', 'name');

  // Role Change
  expect(within(rows[3]).getByRole('cell', { name: 'Member' })).toHaveAttribute(
    'data-field',
    'role'
  );
  const roleButton = within(rows[3]).getByRole('button', { name: 'Member' });
  expect(roleButton).toBeInTheDocument();
  await act(async () => fireEvent.mouseDown(roleButton));
  await act(
    async () =>
      await fireEvent.click(screen.getByRole('option', { name: 'Manager' }))
  );
  await waitFor(() =>
    expect(
      within(rows[3]).getByRole('cell', { name: 'Manager' })
    ).toHaveAttribute('data-field', 'role')
  );

  // Remove member
  expect(within(listSection).getAllByRole('row').length).toBe(4);
  const removeButton = within(rows[3]).getByRole('button', { name: 'Remove' });
  await act(async () => fireEvent.click(removeButton));
  await act(async () =>
    fireEvent.click(screen.getByRole('button', { name: 'Remove Member' }))
  );
  await waitFor(() =>
    expect(within(listSection).getAllByRole('row').length).toBe(3)
  );

  // Pending members
  const pendingSection = within(
    screen.getByRole('region', {
      name: 'Pending Members',
    })
  );
  expect(pendingSection.getAllByRole('listitem').length).toBe(2);

  // Reject
  expect(
    within(pendingSection.getAllByRole('listitem')[0]).getByText(
      'Member name Pending 0 Member Last Name'
    )
  ).toBeInTheDocument();
  await act(
    async () =>
      await fireEvent.click(
        within(pendingSection.getAllByRole('listitem')[0]).getByRole('button', {
          name: 'Deny',
        })
      )
  );
  await act(
    async () =>
      await fireEvent.click(
        screen.getByRole('button', { name: 'Deny Request' })
      )
  );
  await waitFor(() =>
    expect(pendingSection.getAllByRole('listitem').length).toBe(1)
  );

  // Approve
  expect(
    within(pendingSection.getAllByRole('listitem')[0]).getByText(
      'Member name Pending 1 Member Last Name'
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

  expect(pendingSection.getAllByRole('listitem').length).toBe(1);
  expect(
    within(pendingSection.getAllByRole('listitem')[0]).getByText(
      'Member name Pending 0 Member Last Name'
    )
  ).toBeInTheDocument();
  await waitFor(() =>
    expect(within(listSection).getAllByRole('row').length).toBe(5)
  );
});
