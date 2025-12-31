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

import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from 'terraso-web-client/tests/utils';
import { useSearchParams } from 'react-router';
import * as terrasoApi from 'terraso-client-shared/terrasoApi/api';
import { mockTerrasoAPIrequestGraphQL } from 'terraso-web-client/tests/apiUtils';
import useMediaQuery from '@mui/material/useMediaQuery';

import mapboxgl from 'terraso-web-client/gis/mapbox';
import LandscapeList from 'terraso-web-client/landscape/components/LandscapeList';

const GEOJSON =
  '{"type": "FeatureCollection", "features": [{"type": "Feature", "geometry": {"type": "Polygon", "coordinates": [[[-80.02098083496094, 0.8184536092473124], [-80.04364013671875, 0.8177670337355836], [-80.04844665527342, 0.8184536092473124], [-80.04981994628906, 0.8260059320976082], [-80.07247924804686, 0.802662342941431], [-80.09170532226562, 0.779318620539376], [-80.10063171386719, 0.7532284249372649], [-80.09857177734375, 0.7223319390984623], [-80.09307861328125, 0.7140928403610857], [-80.10337829589842, 0.6955548144696846], [-80.09788513183594, 0.6742703246919985], [-80.08827209472656, 0.6488661346824502], [-80.07797241210938, 0.6495527361122139], [-80.06561279296875, 0.6522991408974699], [-80.06235122680664, 0.6468063298344634], [-80.02098083496094, 0.8184536092473124]]]}, "properties": {}}]}';

jest.mock('terraso-client-shared/terrasoApi/api');

jest.mock('terraso-web-client/gis/mapbox', () => ({}));

jest.mock('@mui/material/useMediaQuery');

jest.mock('react-router', () => ({
  ...jest.requireActual('react-router'),
  useSearchParams: jest.fn(),
}));

beforeEach(() => {
  mapboxgl.Popup = jest.fn();
  mapboxgl.NavigationControl = jest.fn();
  mapboxgl.LngLatBounds = jest.fn();
  mapboxgl.LngLatBounds.prototype = {
    extend: jest.fn().mockReturnThis(),
    isEmpty: jest.fn().mockReturnValue(false),
  };
  mapboxgl.Map = jest.fn();
  mapboxgl.Map.mockReturnValue({
    on: jest.fn(),
    remove: jest.fn(),
    off: jest.fn(),
    getCanvas: jest.fn(),
    addControl: jest.fn(),
    addSource: jest.fn(),
    addLayer: jest.fn(),
  });
  window.HTMLElement.prototype.scrollIntoView = jest.fn();
});

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

const setupTestMap = async () => {
  const events = {};
  const map = {
    on: jest.fn().mockImplementation((...args) => {
      const event = args[0];
      const callback = args.length === 2 ? args[1] : args[2];
      const layer = args.length === 2 ? null : args[1];
      events[[event, layer].filter(p => p).join(':')] = callback;

      if (event === 'load') {
        callback();
      }
    }),
    remove: jest.fn(),
    off: jest.fn(),
    getCanvas: jest.fn(),
    addControl: jest.fn(),
    removeControl: jest.fn(),
    addSource: jest.fn(),
    getSource: jest.fn(),
    addLayer: jest.fn(),
    getLayer: jest.fn(),
    setTerrain: jest.fn(),
    fitBounds: jest.fn(),
  };
  mapboxgl.Map.mockReturnValue(map);
  const Popup = {
    setLngLat: jest.fn().mockReturnThis(),
    setMaxWidth: jest.fn().mockReturnThis(),
    setDOMContent: jest.fn().mockReturnThis(),
    addTo: jest.fn().mockReturnThis(),
    remove: jest.fn(),
  };
  mapboxgl.Popup.mockReturnValue(Popup);
  return {
    map: map,
    events: events,
    Popup: Popup,
  };
};

const baseListTest = async () => {
  const { map, events, Popup } = await setupTestMap();
  const membersCounts = [0, 23, 59, 2, 1, 28, 6, 23, 9, 11, 1, 2, 3, 4, 5];
  const isMember = {
    3: true,
  };
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
        areaPolygon: GEOJSON,
        membershipList: {
          membershipsCount: membersCounts[landscapeIndex],
          accountMembership: isMember[landscapeIndex]
            ? {
                userRole: 'member',
                id: 'membership-id',
              }
            : null,
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
  expect(map.addSource).toHaveBeenCalledTimes(3);
  expect(map.addSource.mock.calls[2][0]).toEqual('landscapes');
  const geojson = map.addSource.mock.calls[2][1].data;
  expect(geojson.features.length).toBe(15);

  expect(map.addLayer).toHaveBeenCalledTimes(5);
  expect(map.addLayer.mock.calls[2][0]).toMatchObject({ id: 'clusters' });
  expect(map.addLayer.mock.calls[3][0]).toMatchObject({ id: 'cluster-count' });
  expect(map.addLayer.mock.calls[4][0]).toMatchObject({
    id: 'unclustered-point',
  });

  await act(async () =>
    events['click:unclustered-point']({
      features: [geojson.features[0]],
      lngLat: {
        lng: 0,
        lat: 0,
      },
    })
  );
  const domElement = Popup.setDOMContent.mock.calls[0][0];
  expect(domElement.querySelector('a').href).toEqual(
    'http://localhost/landscapes/landscape-0'
  );
  expect(domElement.querySelector('a').textContent).toEqual('Landscape Name 0');
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
  });
  expect(loader).toBeInTheDocument();
});

test('LandscapeList: Empty', async () => {
  const { map } = await setupTestMap();
  mapboxgl.LngLatBounds.prototype.isEmpty = jest.fn().mockReturnValue(true);

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

  expect(map.fitBounds.mock.calls).toHaveLength(0);
});

test('LandscapeList: Non-empty', async () => {
  const { map } = await setupTestMap();
  mapboxgl.LngLatBounds.prototype.isEmpty = jest.fn().mockReturnValue(false);

  terrasoApi.requestGraphQL.mockReturnValue(
    Promise.resolve({
      landscapes: {
        edges: [],
      },
    })
  );
  await setup();

  expect(map.fitBounds.mock.calls).toHaveLength(1);
});

test('LandscapeList: Display list', async () => {
  await baseListTest();

  const rows = screen.getAllByRole('row');
  expect(rows.length).toBe(16); // 15 displayed + header
  expect(
    within(rows[2]).getByRole('gridcell', { name: 'Landscape Name 1' })
  ).toHaveAttribute('data-field', 'name');
  expect(within(rows[2]).getByRole('gridcell', { name: '23' })).toHaveAttribute(
    'data-field',
    'members'
  );
  expect(
    within(rows[2])
      .getByRole('button', { name: 'Join: Landscape Name 1' })
      .closest('[role="gridcell"]')
  ).toHaveAttribute('data-field', 'actions');
  expect(
    within(rows[9])
      .getByRole('button', { name: 'Leave: Landscape Name 3' })
      .closest('[role="gridcell"]')
  ).toHaveAttribute('data-field', 'actions');
});
test('LandscapeList: Search', async () => {
  await baseListTest();

  const searchInput = screen.getByRole('textbox', {
    name: 'Search landscapes',
  });
  expect(searchInput).toBeInTheDocument();
  await act(async () =>
    fireEvent.change(searchInput, { target: { value: 'Landscape Name 1' } })
  );
  await waitFor(() => expect(screen.getAllByRole('row').length).toBe(7));
  const rows = screen.getAllByRole('row');
  await waitFor(() => expect(rows.length).toBe(7)); // 10 to 15 displayed + header
});
test('LandscapeList: Clear search', async () => {
  const searchParams = new URLSearchParams('search=Landscape Name 1');
  const setSearchParams = jest.fn();
  useSearchParams.mockReturnValue([searchParams, setSearchParams]);
  await baseListTest();

  await waitFor(() => expect(screen.getAllByRole('row').length).toBe(7));
  const rows = screen.getAllByRole('row');
  await waitFor(() => expect(rows.length).toBe(7));

  // Clear search button
  const clearSearchButton = screen.getByRole('button', {
    name: 'Clear search',
  });
  await act(async () => fireEvent.click(clearSearchButton));
  expect(setSearchParams).toHaveBeenCalledTimes(3);
  expect(setSearchParams.mock.calls[2][0]).toStrictEqual({});
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
        website: 'https://www.landscape.org',
        location: 'Ecuador, Quito',
        membershipList: {
          memberships: generateMemberhips(
            landscapeIndex,
            membersCounts[landscapeIndex]
          ),
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
    within(rows[1]).getByRole('gridcell', { name: 'Landscape Name 0' })
  ).toHaveAttribute('data-field', 'name');
  await act(async () =>
    fireEvent.click(
      within(rows[0]).getByRole('columnheader', { name: 'Landscape' })
    )
  );
  const sortedRows = screen.getAllByRole('row');
  expect(sortedRows.length).toBe(16); // 15 displayed + header
  expect(
    within(sortedRows[1]).getByRole('gridcell', { name: 'Landscape Name 9' })
  ).toHaveAttribute('data-field', 'name');
});
test('LandscapeList: Display list (small screen)', async () => {
  useMediaQuery.mockReturnValue(true);
  const isMember = {
    3: true,
  };

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
        membershipList: {
          membershipsCount: membersCounts[landscapeIndex],
          accountMembership: isMember[landscapeIndex]
            ? {
                userRole: 'member',
                id: 'membership-id',
              }
            : null,
        },
      },
    }));

  mockTerrasoAPIrequestGraphQL({
    'query landscapes': Promise.resolve({
      landscapes: {
        edges: landscapes,
      },
    }),
  });
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
  expect(within(rows[1]).getByText('Join')).toBeInTheDocument();
  expect(within(rows[8]).getByText('Leave')).toBeInTheDocument();
});
