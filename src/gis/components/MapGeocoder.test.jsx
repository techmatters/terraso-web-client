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
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see https://www.gnu.org/licenses/.
 */

import { render } from 'terraso-web-client/tests/utils';
import MapboxGlGeocoder from '@mapbox/mapbox-gl-geocoder';
import { createMapMock } from 'terraso-web-client/tests/mapboxMock';

import { useMap } from 'terraso-web-client/gis/components/Map';
import MapGeocoder from 'terraso-web-client/gis/components/MapGeocoder';

// The geocoder's OPTION BEHAVIOR (coordinate localGeocoder, getItemValue,
// render + HTML escaping) is unit-tested here on its own; the editor suite
// keeps the wiring assertions (one control on the map, addControl position).
jest.mock('terraso-web-client/gis/components/Map', () => ({
  __esModule: true,
  default: () => null,
  useMap: jest.fn(),
}));

let map;
let geocoderOptions;

beforeEach(() => {
  map = createMapMock();
  useMap.mockReturnValue({ map });
  geocoderOptions = () => MapboxGlGeocoder.mock.calls[0][0];
});

test('MapGeocoder: coordinate searches return a result with lng/lat swapped to mapbox order', async () => {
  await render(<MapGeocoder position="top-right" onResult={jest.fn()} />);

  const [coordinateResult] =
    geocoderOptions().localGeocoder('1.2345, -77.6543');

  expect(coordinateResult.center).toEqual([-77.6543, 1.2345]);
  expect(coordinateResult.place_name).toEqual('Coordinates: 1.2345, -77.6543');
});

test('MapGeocoder: getItemValue round-trips coordinate queries and standard results', async () => {
  await render(<MapGeocoder position="top-right" onResult={jest.fn()} />);

  const options = geocoderOptions();
  const [coordinateResult] = options.localGeocoder('1.2345, -77.6543');
  expect(options.getItemValue(coordinateResult)).toEqual('1.2345, -77.6543');

  const standardResult = { place_name: 'Quito, Ecuador' };
  expect(options.getItemValue(standardResult)).toEqual('Quito, Ecuador');
});

test('MapGeocoder: render formats coordinate results and escapes standard results', async () => {
  await render(<MapGeocoder position="top-right" onResult={jest.fn()} />);

  const options = geocoderOptions();
  const [coordinateResult] = options.localGeocoder('1.2345, -77.6543');
  expect(options.render(coordinateResult)).toEqual(
    '<div class="mapboxgl-ctrl-geocoder__result-coordinate">Coordinates: 1.2345, -77.6543</div>'
  );

  expect(options.render({ place_name: 'Quito, Ecuador' })).toEqual(
    'Quito, Ecuador'
  );

  // HTML in a result label is escaped (results render as innerHTML).
  expect(
    options.render({
      place_name: '<b>Quito</b> & "Ecuador"',
    })
  ).toEqual('&lt;b&gt;Quito&lt;/b&gt; &amp; &quot;Ecuador&quot;');
});

test('MapGeocoder: adds one control to the map at the requested position', async () => {
  await render(<MapGeocoder position="top-right" onResult={jest.fn()} />);

  expect(MapboxGlGeocoder).toHaveBeenCalledTimes(1);
  expect(map.addControl).toHaveBeenCalledWith(expect.anything(), 'top-right');
});
