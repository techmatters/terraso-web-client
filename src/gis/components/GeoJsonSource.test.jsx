/*
 * Copyright © 2025 Technology Matters
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

const emptyFeatureCollection = { type: 'FeatureCollection', features: [] };

test('GeoJsonSource: adds the source on mount', async () => {
  const addSource = jest.fn();
  useMap.mockReturnValue({
    map: { getSource: jest.fn() },
    addSource,
    removeSource: jest.fn(),
  });

  await render(
    <GeoJsonSource id="data-layer" geoJson={emptyFeatureCollection} />
  );

  expect(addSource).toHaveBeenCalledWith('data-layer', {
    type: 'geojson',
    data: emptyFeatureCollection,
  });
});

test('GeoJsonSource: removes its source on unmount (symmetric with Layer.js)', async () => {
  const removeSource = jest.fn();
  useMap.mockReturnValue({
    map: { getSource: jest.fn(() => ({})) },
    addSource: jest.fn(),
    removeSource,
  });

  const { unmount } = await render(
    <GeoJsonSource id="data-layer" geoJson={emptyFeatureCollection} />
  );
  expect(removeSource).not.toHaveBeenCalled();

  // Without the cleanup, a later style switch (which resurrects every source
  // tracked by the map provider) brings this stale source back to life.
  unmount();

  expect(removeSource).toHaveBeenCalledWith('data-layer');
});

test('GeoJsonSource: does not remove a source that is already gone', async () => {
  const removeSource = jest.fn();
  useMap.mockReturnValue({
    map: { getSource: jest.fn(() => undefined) },
    addSource: jest.fn(),
    removeSource,
  });

  const { unmount } = await render(
    <GeoJsonSource id="data-layer" geoJson={emptyFeatureCollection} />
  );
  unmount();

  expect(removeSource).not.toHaveBeenCalled();
});
