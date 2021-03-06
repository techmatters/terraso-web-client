import { fireEvent, render, screen, waitFor, within } from 'tests/utils';

import React from 'react';

import _ from 'lodash/fp';
import { act } from 'react-dom/test-utils';
import MarkerClusterGroup from 'react-leaflet-markercluster';
import { useSearchParams } from 'react-router-dom';

import useMediaQuery from '@mui/material/useMediaQuery';

import LandscapeList from 'landscape/components/LandscapeList';
import * as terrasoApi from 'terrasoBackend/api';

const GEOJSON =
  '{"type": "FeatureCollection", "features": [{"type": "Feature", "geometry": {"type": "Polygon", "coordinates": [[[-80.02098083496094, 0.8184536092473124], [-80.04364013671875, 0.8177670337355836], [-80.04844665527342, 0.8184536092473124], [-80.04981994628906, 0.8260059320976082], [-80.07247924804686, 0.802662342941431], [-80.09170532226562, 0.779318620539376], [-80.10063171386719, 0.7532284249372649], [-80.09857177734375, 0.7223319390984623], [-80.09307861328125, 0.7140928403610857], [-80.10337829589842, 0.6955548144696846], [-80.09788513183594, 0.6742703246919985], [-80.08827209472656, 0.6488661346824502], [-80.07797241210938, 0.6495527361122139], [-80.06561279296875, 0.6522991408974699], [-80.06235122680664, 0.6468063298344634], [-80.02098083496094, 0.8184536092473124]]]}, "properties": {}}]}';

// Omit console error for DataGrid issue: https://github.com/mui/mui-x/issues/3850
global.console.error = jest.fn();

jest.mock('terrasoBackend/api');
jest.mock('react-leaflet-markercluster', () => jest.fn());

jest.mock('@mui/material/useMediaQuery');

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useSearchParams: jest.fn(),
}));

const setup = async initialState => {
  // TODO Improve testing to test clusters functionality
  MarkerClusterGroup.mockImplementation(({ children }) => <>{children}</>);

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

const baseListTest = async () => {
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
        areaPolygon: GEOJSON,
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

  terrasoApi.requestGraphQL.mockReturnValue(
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

  // Map
  const mapRegion = screen.getByRole('region', {
    name: 'Landscapes map',
  });
  expect(mapRegion).toBeInTheDocument();

  const markers = within(mapRegion).getAllByRole('button');
  expect(markers.length).toBe(17); // 15 + zoom buttons

  await act(async () => fireEvent.click(markers[0]));

  within(mapRegion).getByRole('link', {
    name: 'View details about Landscape Name 0',
  });

  // Table
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
};

beforeEach(() => {
  useSearchParams.mockReturnValue([new URLSearchParams(), () => {}]);
});

test('LandscapeList: Display error', async () => {
  terrasoApi.requestGraphQL.mockRejectedValue('Load error');
  await setup();
  expect(screen.getByText(/Load error/i)).toBeInTheDocument();
});
test('LandscapeList: Display loader', async () => {
  terrasoApi.requestGraphQL.mockReturnValue(new Promise(() => {}));
  await setup();
  const loader = screen.getByRole('progressbar', {
    name: 'Loading',
    hidden: true,
  });
  expect(loader).toBeInTheDocument();
});
test('LandscapeList: Empty', async () => {
  terrasoApi.requestGraphQL.mockReturnValue(
    Promise.resolve({
      landscapes: {
        edges: [],
      },
    })
  );
  await setup();
  expect(
    screen.getByText('First, double check the spelling of the landscape name.')
  ).toBeInTheDocument();
});
test('LandscapeList: Display list', baseListTest);
test('LandscapeList: Search', async () => {
  await baseListTest();

  const searchInput = screen.getByRole('textbox', {
    name: 'Search landscapes',
  });
  expect(searchInput).toBeInTheDocument();
  await act(async () =>
    fireEvent.change(searchInput, { target: { value: 'Landscape Name 1' } })
  );
  await new Promise(r => setTimeout(r, 300));
  const rows = screen.getAllByRole('row');
  await waitFor(() => expect(rows.length).toBe(7)); // 10 to 15 displayed + header
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

  terrasoApi.requestGraphQL.mockReturnValue(
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
  await act(async () =>
    fireEvent.click(
      within(rows[0]).getByRole('columnheader', { name: 'Landscape' })
    )
  );
  const sortedRows = screen.getAllByRole('row');
  expect(sortedRows.length).toBe(16); // 15 displayed + header
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

  terrasoApi.requestGraphQL.mockReturnValue(
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
