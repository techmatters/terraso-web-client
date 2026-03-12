/*
 * Copyright © 2023 Technology Matters
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

import { render } from 'terraso-web-client/tests/utils';
import { setupMapboxMock } from 'terraso-web-client/tests/mapboxMock';

import Map from 'terraso-web-client/gis/components/Map';
import mapboxgl from 'terraso-web-client/gis/mapbox';

jest.mock('terraso-web-client/gis/mapbox', () => ({}));

setupMapboxMock();

test('Map: Rejects invalid initial bounds', async () => {
  await render(<Map initialBounds={[-181, 0, 0, 0]} />);

  const mapCall = mapboxgl.Map.mock.calls[0][0];
  expect(mapCall.bounds).toBeUndefined();
});

test('Map: Accepts valid initial bounds', async () => {
  await render(<Map initialBounds={[-180, 0, 0, 0]} />);

  const mapCall = mapboxgl.Map.mock.calls[0][0];
  expect(mapCall.bounds).toEqual([-180, 0, 0, 0]);
});
