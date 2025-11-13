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
import * as terrasoApi from 'terraso-client-shared/terrasoApi/api';
import { mockTerrasoAPIrequestGraphQL } from 'tests/apiUtils';
import useMediaQuery from '@mui/material/useMediaQuery';

import LandscapeMembers from 'landscape/membership/components/LandscapeMembers';

// Omit console error for DataGrid issue: https://github.com/mui/mui-x/issues/3850
global.console.error = jest.fn();

jest.mock('terraso-client-shared/terrasoApi/api');

jest.mock('@mui/material/useMediaQuery');

const setup = async initialState => {
  await render(<LandscapeMembers />, {
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

test('LandscapeMembers: Display error', async () => {
  terrasoApi.requestGraphQL.mockRejectedValue('Load error');
  await setup();
  expect(terrasoApi.requestGraphQL).toHaveBeenCalledTimes(2);
  expect(screen.getByText(/Load error/i)).toBeInTheDocument();
});
test('LandscapeMembers: Display loader', async () => {
  terrasoApi.requestGraphQL.mockReturnValue(new Promise(() => {}));
  await setup();
  const loader = screen.getByRole('progressbar', {
    name: 'Loading',
  });
  expect(loader).toBeInTheDocument();
});
test('LandscapeMembers: Empty', async () => {
  terrasoApi.requestGraphQL.mockReturnValue(
    Promise.resolve(
      _.set(
        'landscapes.edges[0].node',
        {
          name: 'Landscape Name',
          membershipList: { membershipsCount: 0 },
        },
        {}
      )
    )
  );
  await setup();
  expect(screen.getByText(/No members/i)).toBeInTheDocument();
});
test('LandscapeMembers: Display list', async () => {
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

  const membershipList = {
    memberships: generateMemberhips(3, 20),
  };

  const landscape = {
    slug: 'landscape',
    id: 'landscape',
    name: 'Landscape Name',
    description: 'Landscape Description',
    website: 'https://www.landscape.org',
    location: 'Ecuador, Quito',
    membershipList,
  };

  terrasoApi.requestGraphQL
    .mockReturnValueOnce(
      Promise.resolve(_.set('landscapes.edges[0].node', landscape, {}))
    )
    .mockReturnValueOnce(
      Promise.resolve(_.set('landscapes.edges[0].node', landscape, {}))
    );

  await setup();

  // Landscape info
  expect(
    screen.getByRole('heading', { name: 'Landscape Name Members' })
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
  expect(
    within(rows[2]).queryByRole('button', { name: 'Member' })
  ).not.toBeInTheDocument();
  expect(
    within(rows[1])
      .getByRole('button', { name: 'Leave: Landscape Name' })
      .closest('[role="gridcell"]')
  ).toHaveAttribute('data-field', 'actions');
});
test('LandscapeMembers: Display list (small)', async () => {
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

  const membershipList = {
    memberships: generateMemberhips(3, 20),
  };

  const landscape = {
    slug: 'landscape',
    id: 'landscape',
    name: 'Landscape Name',
    description: 'Landscape Description',
    website: 'https://www.landscape.org',
    location: 'Ecuador, Quito',
    membershipList,
  };

  terrasoApi.requestGraphQL
    .mockReturnValueOnce(
      Promise.resolve(_.set('landscapes.edges[0].node', landscape, {}))
    )
    .mockReturnValueOnce(
      Promise.resolve(_.set('landscapes.edges[0].node', landscape, {}))
    );
  await setup();

  // Landscape info
  expect(
    screen.getByRole('heading', { name: 'Landscape Name Members' })
  ).toBeInTheDocument();
  const rows = screen.getAllByRole('listitem');
  expect(rows.length).toBe(20);
  expect(
    within(rows[1]).getByText('Member name Member Last Name')
  ).toBeInTheDocument();
  expect(within(rows[8]).getByText('Member')).toBeInTheDocument();
  expect(within(rows[0]).getByText('Member')).toBeInTheDocument();
});
test('LandscapeMembers: Display list manager', async () => {
  const generateMemberhips = (index, count) => ({
    edges: Array(count)
      .fill(0)
      .map((i, index) =>
        _.flow(
          _.set('node.user', {
            id: `index-${index}`,
            firstName: `Member name ${index}`,
            lastName: `Member Last Name ${index}`,
            email: `email${index}@email.com`,
          }),
          _.set('node.userRole', 'member'),
          _.set('node.id', `membership-${index}`),
          _.set('node.membershipStatus', 'APPROVED')
        )({})
      ),
  });

  const membershipList = {
    memberships: generateMemberhips(3, 57),
    accountMembership: { userRole: 'manager', membershipStatus: 'APPROVED' },
  };

  const landscape = {
    slug: 'landscape',
    id: 'landscape',
    name: 'Landscape Name',
    description: 'Landscape Description',
    website: 'https://www.landscape.org',
    location: 'Ecuador, Quito',
    membershipList,
  };

  terrasoApi.requestGraphQL
    .mockReturnValueOnce(
      Promise.resolve(_.set('landscapes.edges[0].node', landscape, {}))
    )
    .mockReturnValueOnce(
      Promise.resolve(_.set('landscapes.edges[0].node', landscape, {}))
    );
  await setup();

  // Landscape info
  expect(
    screen.getByRole('heading', { name: 'Manage Members' })
  ).toBeInTheDocument();
  const rows = screen.getAllByRole('row');
  expect(rows.length).toBe(16); // 15 displayed + header
  expect(
    within(rows[2]).getByRole('gridcell', {
      name: 'Member name 1 Member Last Name 1',
    })
  ).toHaveAttribute('data-field', 'name');
  expect(
    within(rows[9])
      .getByRole('combobox', { name: 'Role' })
      .closest('[role="gridcell"]')
  ).toHaveAttribute('data-field', 'role');
  expect(
    within(within(rows[9]).getByRole('combobox', { name: 'Role' })).getByText(
      'Member'
    )
  ).toBeInTheDocument();
  expect(
    within(rows[2])
      .getByRole('button', { name: 'Remove' })
      .closest('[role="gridcell"]')
  ).toHaveAttribute('data-field', 'actions');
});
test('LandscapeMembers: Manager actions', async () => {
  const generateMemberhips = (index, count) => ({
    edges: Array(count)
      .fill(0)
      .map((i, index) =>
        _.flow(
          _.set('node.user', {
            id: `index-${index}`,
            firstName: `Member name ${index}`,
            lastName: `Member Last Name ${index}`,
            email: `email${index}@email.com`,
          }),
          _.set('node.userRole', 'member'),
          _.set('node.id', `membership-${index}`),
          _.set('node.membershipStatus', 'APPROVED')
        )({})
      ),
  });

  const membershipList = {
    memberships: generateMemberhips(3, 3),
    accountMembership: { userRole: 'manager', membershipStatus: 'APPROVED' },
  };

  const landscape = {
    slug: 'landscape',
    id: 'landscape',
    name: 'Landscape Name',
    description: 'Landscape Description',
    website: 'https://www.landscape.org',
    location: 'Ecuador, Quito',
    membershipList,
  };

  mockTerrasoAPIrequestGraphQL({
    'query landscapes': Promise.resolve(
      _.set('landscapes.edges[0].node', landscape, {})
    ),
    'mutation changeMemberRole': Promise.resolve(
      _.set(
        'saveLandscapeMembership.memberships[0]',
        {
          id: 'membership-2',
          userRole: 'manager',
          membershipStatus: 'APPROVED',
          user: {
            firstName: 'Member name 2',
            lastName: 'Member Last Name 2',
            email: `email2@email.com`,
          },
        },
        {}
      )
    ),
    'mutation removeMember': Promise.resolve(
      _.set(
        'deleteLandscapeMembership.membership',
        membershipList.memberships.edges.slice(0, -1),
        {}
      )
    ),
  });

  await setup();

  // Landscape info
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
  expect(roleButton).toBeInTheDocument();
  await act(async () => fireEvent.mouseDown(roleButton));
  expect(screen.getByRole('option', { name: 'Manager' })).toBeInTheDocument();
  await act(
    async () =>
      await fireEvent.click(screen.getByRole('option', { name: 'Manager' }))
  );
  expect(terrasoApi.requestGraphQL).toHaveBeenCalledWith(
    expect.anything(),
    expect.objectContaining({
      input: {
        landscapeSlug: landscape.slug,
        userEmails: ['email2@email.com'],
        userRole: 'manager',
      },
    })
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
  expect(terrasoApi.requestGraphQL).toHaveBeenCalledWith(
    expect.anything(),
    expect.objectContaining({
      input: { id: 'membership-2', landscapeSlug: landscape.slug },
    })
  );

  expect(screen.getAllByRole('row').length).toBe(3);
  await waitFor(() => expect(screen.getAllByRole('row').length).toBe(3));
  const removedRows = screen.getAllByRole('row');
  expect(removedRows.length).toBe(3);

  expect(
    screen.getByRole('region', {
      name: 'Current Members',
    })
  ).toBeInTheDocument();
});
