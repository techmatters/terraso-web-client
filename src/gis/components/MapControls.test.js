/*
 * Copyright © 2026 Technology Matters
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

import MapControls from 'terraso-web-client/gis/components/MapControls';
import { useMap } from 'terraso-web-client/gis/components/Map';
import mapboxgl from 'terraso-web-client/gis/mapbox';

jest.mock('terraso-web-client/gis/mapbox', () => ({}));
jest.mock('terraso-web-client/gis/components/Map', () => ({
  useMap: jest.fn(),
}));

beforeEach(() => {
  mapboxgl.NavigationControl = jest.fn();
});

const setup = () => {
  const map = {
    addControl: jest.fn(),
    removeControl: jest.fn(),
  };
  useMap.mockReturnValue({ map });
  return { map };
};

test('MapControls: adds its navigation control on mount', async () => {
  const { map } = setup();

  await render(<MapControls />);

  expect(map.addControl).toHaveBeenCalledTimes(1);
  expect(map.addControl.mock.calls[0][1]).toBe('top-left');
});

test('MapControls: removes the SAME control instance on unmount', async () => {
  const { map } = setup();

  const { unmount } = await render(<MapControls />);
  unmount();

  expect(map.removeControl).toHaveBeenCalledTimes(1);
  expect(map.removeControl.mock.calls[0][0]).toBe(map.addControl.mock.calls[0][0]);
});

test('MapControls: remounting does not stack up controls on a shared map', async () => {
  const { map } = setup();

  const first = await render(<MapControls />);
  first.unmount();
  const second = await render(<MapControls />);
  second.unmount();

  // Each mount adds its own control and removes exactly that instance: the
  // shared map never carries more than one.
  expect(map.addControl).toHaveBeenCalledTimes(2);
  expect(map.removeControl).toHaveBeenCalledTimes(2);
  expect(map.addControl.mock.calls[0][0]).toBe(map.removeControl.mock.calls[0][0]);
  expect(map.addControl.mock.calls[1][0]).toBe(map.removeControl.mock.calls[1][0]);
  expect(map.addControl.mock.calls[1][0]).not.toBe(
    map.addControl.mock.calls[0][0]
  );
});
