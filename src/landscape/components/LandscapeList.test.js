import React from 'react';
import _ from 'lodash/fp';
import useMediaQuery from '@mui/material/useMediaQuery';

import { render, screen, within, fireEvent } from 'tests/utils';
import LandscapeList from 'landscape/components/LandscapeList';
import * as terrasoApi from 'terrasoBackend/api';

// Omit console error for DataGrid issue: https://github.com/mui/mui-x/issues/3850
global.console.error = jest.fn();

jest.mock('terrasoBackend/api');

jest.mock('@mui/material/useMediaQuery');

const setup = async initialState => {
  await render(<LandscapeList />, {
    account: {
      hasToken: true,
      currentUser: {
        fetching: false,
        data: {
          email: 'email@email.com',
        },
      },
    },
    ...initialState,
  });
};

test('LandscapeList: Display error', async () => {
  terrasoApi.request.mockRejectedValue('Load error');
  await setup();
  expect(screen.getByText(/Load error/i)).toBeInTheDocument();
});
test('LandscapeList: Display loader', async () => {
  terrasoApi.request.mockReturnValue(new Promise(() => {}));
  await setup();
  const loader = screen.getByRole('progressbar', {
    name: 'Loading',
    hidden: true,
  });
  expect(loader).toBeInTheDocument();
});
test('LandscapeList: Empty', async () => {
  terrasoApi.request.mockReturnValue(
    Promise.resolve({
      landscapes: {
        edges: [],
      },
    })
  );
  await setup();
  expect(screen.getByText(/No Landscapes/i)).toBeInTheDocument();
});
test('LandscapeList: Display list', async () => {
  const isMember = {
    3: true,
  };

  const generateMemberhips = (index, count) => ({
    totalCount: count,
    edges: Array(5)
      .fill(0)
      .map(() => ({
        node: {
          user: {
            firstName: 'Member name',
            lastName: 'Member Last Name',
            email: 'other@email.com',
          },
        },
      })),
  });

  const membersCounts = [0, 23, 59, 2, 1, 28, 6, 23, 9, 11, 1, 2, 3, 4, 5];

  const landscapes = Array(15)
    .fill(0)
    .map((i, landscapeIndex) => ({
      node: {
        slug: `landscape-${landscapeIndex}`,
        id: `landscape-${landscapeIndex}`,
        name: `Landscape Name ${landscapeIndex}`,
        description: 'Landscape Description',
        website: 'www.landscape.org',
        location: 'Ecuador, Quito',
        defaultGroup: {
          edges: [
            {
              node: {
                group: {
                  slug: `test-group-slug-${landscapeIndex}`,
                  memberships: generateMemberhips(
                    landscapeIndex,
                    membersCounts[landscapeIndex]
                  ),
                  accountMembership: isMember[landscapeIndex]
                    ? _.set('edges[0].node.userRole', 'MEMBER', {})
                    : null,
                },
              },
            },
          ],
        },
      },
    }));

  terrasoApi.request.mockReturnValue(
    Promise.resolve({
      landscapes: {
        edges: landscapes,
      },
    })
  );
  await setup();

  // Landscape info
  expect(
    screen.getByRole('heading', { name: 'Landscapes' })
  ).toBeInTheDocument();
  const rows = screen.getAllByRole('row');
  expect(rows.length).toBe(16); // 15 displayed + header
  expect(
    within(rows[2]).getByRole('cell', { name: 'Landscape Name 1' })
  ).toHaveAttribute('data-field', 'name');
  expect(within(rows[2]).getByRole('cell', { name: '23' })).toHaveAttribute(
    'data-field',
    'members'
  );
  expect(
    within(rows[2]).getByRole('cell', { name: 'Connect' })
  ).toHaveAttribute('data-field', 'actions');
  expect(within(rows[9]).getByRole('cell', { name: 'Member' })).toHaveAttribute(
    'data-field',
    'actions'
  );
});
test('LandscapeList: List sort', async () => {
  const isMember = {
    3: true,
  };

  const generateMemberhips = (index, count) => ({
    edges: Array(count)
      .fill(0)
      .map(() => ({
        node: {
          user: {
            firstName: 'Member name',
            lastName: 'Member Last Name',
            email: isMember[index] ? 'email@email.com' : 'other@email.com',
          },
        },
      })),
  });

  const membersCounts = [0, 23, 59, 2, 1, 28, 6, 23, 9, 11, 1, 2, 3, 4, 5];

  const landscapes = Array(15)
    .fill(0)
    .map((i, landscapeIndex) => ({
      node: {
        slug: `landscape-${landscapeIndex}`,
        id: `landscape-${landscapeIndex}`,
        name: `Landscape Name ${landscapeIndex}`,
        description: 'Landscape Description',
        website: 'www.landscape.org',
        location: 'Ecuador, Quito',
        defaultGroup: {
          edges: [
            {
              node: {
                group: {
                  slug: `test-group-slug-${landscapeIndex}`,
                  memberships: generateMemberhips(
                    landscapeIndex,
                    membersCounts[landscapeIndex]
                  ),
                },
              },
            },
          ],
        },
      },
    }));

  terrasoApi.request.mockReturnValue(
    Promise.resolve({
      landscapes: {
        edges: landscapes,
      },
    })
  );
  await setup();

  // Landscape info
  expect(
    screen.getByRole('heading', { name: 'Landscapes' })
  ).toBeInTheDocument();
  const rows = screen.getAllByRole('row');
  expect(rows.length).toBe(16); // 15 displayed + header

  // Sorting
  expect(
    within(rows[1]).getByRole('cell', { name: 'Landscape Name 0' })
  ).toHaveAttribute('data-field', 'name');
  await fireEvent.click(
    within(rows[0]).getByRole('columnheader', { name: 'Landscape' })
  );
  const sortedRows = screen.getAllByRole('row');
  expect(
    within(sortedRows[1]).getByRole('cell', { name: 'Landscape Name 9' })
  ).toHaveAttribute('data-field', 'name');
});
test('LandscapeList: Display list (small screen)', async () => {
  useMediaQuery.mockReturnValue(true);
  const isMember = {
    3: true,
  };

  const generateMemberhips = (index, count) => ({
    totalCount: count,
    edges: Array(5)
      .fill(0)
      .map(() => ({
        node: {
          user: {
            firstName: 'Member name',
            lastName: 'Member Last Name',
            email: 'other@email.com',
          },
        },
      })),
  });

  const membersCounts = [0, 23, 59, 2, 1, 28, 6, 23, 9, 11, 1, 2, 3, 4, 5];

  const landscapes = Array(15)
    .fill(0)
    .map((i, landscapeIndex) => ({
      node: {
        slug: `landscape-${landscapeIndex}`,
        id: `landscape-${landscapeIndex}`,
        name: `Landscape Name ${landscapeIndex}`,
        description: 'Landscape Description',
        website: 'https://www.landscape.org',
        location: 'Ecuador, Quito',
        defaultGroup: {
          edges: [
            {
              node: {
                group: {
                  slug: `test-group-slug-${landscapeIndex}`,
                  memberships: generateMemberhips(
                    landscapeIndex,
                    membersCounts[landscapeIndex]
                  ),
                  accountMembership: isMember[landscapeIndex]
                    ? _.set('edges[0].node.userRole', 'MEMBER', {})
                    : null,
                },
              },
            },
          ],
        },
      },
    }));

  terrasoApi.request.mockReturnValue(
    Promise.resolve({
      landscapes: {
        edges: landscapes,
      },
    })
  );
  await setup();

  // Landscape info
  expect(
    screen.getByRole('heading', { name: 'Landscapes' })
  ).toBeInTheDocument();

  const rows = screen.getAllByRole('listitem');
  expect(rows.length).toBe(15);
  expect(within(rows[1]).getByText('Landscape Name 1')).toBeInTheDocument();
  expect(
    within(rows[1]).getByText('https://www.landscape.org')
  ).toBeInTheDocument();
  expect(within(rows[1]).getByText('23')).toBeInTheDocument();
  expect(within(rows[1]).getByText('Connect')).toBeInTheDocument();
  expect(within(rows[8]).getByText('Member')).toBeInTheDocument();
});
