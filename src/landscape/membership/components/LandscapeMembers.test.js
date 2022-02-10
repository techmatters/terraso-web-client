import React from 'react';
import _ from 'lodash/fp';
import { act } from 'react-dom/test-utils';
import useMediaQuery from '@mui/material/useMediaQuery';

import { render, screen, within, fireEvent } from 'tests/utils';
import LandscapeMembers from 'landscape/membership/components/LandscapeMembers';
import * as terrasoApi from 'terrasoBackend/api';

// Omit console error for DataGrid issue: https://github.com/mui/mui-x/issues/3850
global.console.error = jest.fn();

jest.mock('terrasoBackend/api');

jest.mock('@mui/material/useMediaQuery');

const setup = async initialState => {
  await act(async () =>
    render(<LandscapeMembers />, {
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
    })
  );
};

test('LandscapeMembers: Display error', async () => {
  terrasoApi.request.mockRejectedValue('Load error');
  await setup();
  expect(terrasoApi.request).toHaveBeenCalledTimes(1);
  expect(screen.getByText(/Load error/i)).toBeInTheDocument();
});
test('LandscapeMembers: Display loader', async () => {
  terrasoApi.request.mockReturnValue(new Promise(() => {}));
  await setup();
  const loader = screen.getByRole('progressbar', { name: '', hidden: true });
  expect(loader).toBeInTheDocument();
});
test('LandscapeMembers: Empty', async () => {
  terrasoApi.request.mockReturnValue(
    Promise.resolve(
      _.set(
        'landscapes.edges[0].node',
        {
          name: 'Landscape Name',
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
            firstName: 'Member name',
            lastName: 'Member Last Name',
            email:
              index === 0 ? 'john.doe@email.com' : `email${index}@email.com`,
          }),
          _.set('node.userRole', 'member')
        )({})
      ),
  });

  const group = {
    slug: 'test-group-slug',
    name: 'Group Name',
    memberships: generateMemberhips(3, 20),
  };

  const landscape = {
    slug: 'landscape',
    id: 'landscape',
    name: 'Landscape Name',
    description: 'Landscape Description',
    website: 'www.landscape.org',
    location: 'Ecuador, Quito',
    associatedGroups: {
      edges: [
        {
          node: { group },
        },
      ],
    },
  };

  terrasoApi.request
    .mockReturnValueOnce(
      Promise.resolve(_.set('landscapes.edges[0].node', landscape, {}))
    )
    .mockReturnValueOnce(
      Promise.resolve(_.set('groups.edges[0].node', group, {}))
    );
  await setup();

  // Landscape info
  expect(
    screen.getByRole('heading', { name: 'Landscape Name Members' })
  ).toBeInTheDocument();
  const rows = screen.getAllByRole('row');
  expect(rows.length).toBe(16); // 15 displayed + header
  expect(
    within(rows[2]).getByRole('cell', {
      name: 'Member name Member Last Name Member name Member Last Name',
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
          _.set('node.userRole', 'member')
        )({})
      ),
  });

  const group = {
    slug: 'test-group-slug',
    name: 'Group Name',
    memberships: generateMemberhips(3, 20),
  };

  const landscape = {
    slug: 'landscape',
    id: 'landscape',
    name: 'Landscape Name',
    description: 'Landscape Description',
    website: 'www.landscape.org',
    location: 'Ecuador, Quito',
    associatedGroups: {
      edges: [
        {
          node: { group },
        },
      ],
    },
  };

  terrasoApi.request
    .mockReturnValueOnce(
      Promise.resolve(_.set('landscapes.edges[0].node', landscape, {}))
    )
    .mockReturnValueOnce(
      Promise.resolve(_.set('groups.edges[0].node', group, {}))
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
            firstName: 'Member name',
            lastName: 'Member Last Name',
            email: 'email@email.com',
          }),
          _.set('node.userRole', 'MEMBER')
        )({})
      ),
  });

  const group = {
    slug: 'test-group-slug',
    name: 'Group Name',
    memberships: generateMemberhips(3, 57),
    accountMembership: _.set('edges[0].node.userRole', 'MANAGER', {}),
  };

  const landscape = {
    slug: 'landscape',
    id: 'landscape',
    name: 'Landscape Name',
    description: 'Landscape Description',
    website: 'www.landscape.org',
    location: 'Ecuador, Quito',
    associatedGroups: {
      edges: [
        {
          node: { group },
        },
      ],
    },
  };

  terrasoApi.request
    .mockReturnValueOnce(
      Promise.resolve(_.set('landscapes.edges[0].node', landscape, {}))
    )
    .mockReturnValueOnce(
      Promise.resolve(_.set('groups.edges[0].node', group, {}))
    );
  await setup();

  // Landscape info
  expect(
    screen.getByRole('heading', { name: 'Manage Members' })
  ).toBeInTheDocument();
  const rows = screen.getAllByRole('row');
  expect(rows.length).toBe(16); // 15 displayed + header
  expect(
    within(rows[2]).getByRole('cell', {
      name: 'Member name Member Last Name Member name Member Last Name',
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
test('LandscapeMembers: Manager actions', async () => {
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
          _.set('node.userRole', 'MEMBER')
        )({})
      ),
  });

  const baseGroup = {
    slug: 'test-group-slug',
    name: 'Group Name',
    memberships: generateMemberhips(3, 3),
    accountMembership: _.set('edges[0].node.userRole', 'MANAGER', {}),
  };

  const landscape = {
    slug: 'landscape',
    id: 'landscape',
    name: 'Landscape Name',
    description: 'Landscape Description',
    website: 'www.landscape.org',
    location: 'Ecuador, Quito',
    associatedGroups: {
      edges: [
        {
          node: {
            group: baseGroup,
          },
        },
      ],
    },
  };

  terrasoApi.request
    .mockReturnValueOnce(
      Promise.resolve(_.set('landscapes.edges[0].node', landscape, {}))
    )
    .mockReturnValueOnce(
      Promise.resolve(_.set('groups.edges[0].node', baseGroup, {}))
    )
    .mockReturnValueOnce(
      Promise.resolve(
        _.flow(
          _.set('updateMembership.membership.group', baseGroup),
          _.set(
            'updateMembership.membership.group.memberships.edges[2].node.userRole',
            'MANAGER'
          )
        )({})
      )
    )
    .mockReturnValueOnce(
      Promise.resolve(
        _.flow(
          _.set('deleteMembership.membership.group', baseGroup),
          _.set(
            'deleteMembership.membership.group.memberships.edges',
            baseGroup.memberships.edges.slice(0, -1)
          )
        )({})
      )
    );

  await setup();

  // Landscape info
  expect(
    screen.getByRole('heading', { name: 'Manage Members' })
  ).toBeInTheDocument();
  const rows = screen.getAllByRole('row');

  // Role Change
  expect(within(rows[3]).getByRole('cell', { name: 'Member' })).toHaveAttribute(
    'data-field',
    'role'
  );
  const roleButton = within(rows[3]).getByRole('button', { name: 'Member' });
  expect(roleButton).toBeInTheDocument();
  await act(async () => fireEvent.mouseDown(roleButton));
  await act(async () =>
    fireEvent.click(screen.getByRole('option', { name: 'Manager' }))
  );
  expect(
    within(rows[3]).getByRole('cell', { name: 'Manager' })
  ).toHaveAttribute('data-field', 'role');

  // Remove member
  expect(rows.length).toBe(4);
  const removeButton = within(rows[3]).getByRole('button', { name: 'Remove' });
  await act(async () => fireEvent.click(removeButton));
  await act(async () =>
    fireEvent.click(screen.getByRole('button', { name: 'Remove Member' }))
  );
  const removedRows = screen.getAllByRole('row');
  expect(removedRows.length).toBe(3);
});
