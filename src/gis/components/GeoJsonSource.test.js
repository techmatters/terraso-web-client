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

import GeoJsonSource from 'terraso-web-client/gis/components/GeoJsonSource';
import { useMap } from 'terraso-web-client/gis/components/Map';

jest.mock('terraso-web-client/gis/components/Map', () => ({
  useMap: jest.fn(),
}));

const setup = () => {
  const addSource = jest.fn();
  const removeSource = jest.fn();
  useMap.mockReturnValue({
    map: { on: jest.fn(), off: jest.fn() },
    addSource,
    removeSource,
  });
  return { addSource, removeSource };
};

test('GeoJsonSource: adds its source on mount', async () => {
  const { addSource } = setup();

  await render(<GeoJsonSource id="data-layer" geoJsonUrl="https://x/1" />);

  expect(addSource).toHaveBeenCalledWith('data-layer', {
    type: 'geojson',
    data: 'https://x/1',
  });
});

test('GeoJsonSource: removes its source on unmount (symmetric teardown)', async () => {
  const { removeSource } = setup();

  const { unmount } = await render(
    <GeoJsonSource id="data-layer" geoJsonUrl="https://x/1" />
  );
  unmount();

  expect(removeSource).toHaveBeenCalledWith('data-layer');
});
