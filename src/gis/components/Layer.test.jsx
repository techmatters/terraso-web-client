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

import Layer from 'terraso-web-client/gis/components/Layer';
import { useMap } from 'terraso-web-client/gis/components/Map';

jest.mock('terraso-web-client/gis/components/Map', () => ({
  useMap: jest.fn(),
}));

test('Layer: notifies after adding a Mapbox layer', async () => {
  const addLayer = jest.fn();
  const onLayerAdded = jest.fn();
  useMap.mockReturnValue({
    map: { getStyle: jest.fn(), getLayer: jest.fn() },
    addImage: jest.fn(),
    addLayer,
    removeImage: jest.fn(),
    removeLayer: jest.fn(),
  });

  await render(
    <Layer
      id="data-layer-markers"
      layer={{ type: 'circle', source: 'data-layer' }}
      onLayerAdded={onLayerAdded}
    />
  );

  expect(addLayer).toHaveBeenCalledWith({
    id: 'data-layer-markers',
    source: 'data-layer',
    type: 'circle',
  });
  expect(onLayerAdded).toHaveBeenCalledWith('data-layer-markers');
});
