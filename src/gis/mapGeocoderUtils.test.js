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

import {
  createCoordinateSearchResult,
  getCoordinateSearchResults,
  parseCoordinateQuery,
} from 'terraso-web-client/gis/mapGeocoderUtils';

test('parseCoordinateQuery: parses latitude and longitude in order', () => {
  expect(parseCoordinateQuery('12.34, -56.78')).toEqual({
    latitude: 12.34,
    longitude: -56.78,
  });
});

test('parseCoordinateQuery: accepts surrounding whitespace', () => {
  expect(parseCoordinateQuery('  -0.2294635 , -78.5441485  ')).toEqual({
    latitude: -0.2294635,
    longitude: -78.5441485,
  });
});

test('parseCoordinateQuery: rejects invalid coordinate ranges', () => {
  expect(parseCoordinateQuery('91, 10')).toBeNull();
  expect(parseCoordinateQuery('10, -181')).toBeNull();
});

test('createCoordinateSearchResult: returns a geocoder feature', () => {
  expect(createCoordinateSearchResult('12.34, -56.78')).toEqual({
    type: 'Feature',
    geometry: {
      type: 'Point',
      coordinates: [-56.78, 12.34],
    },
    center: [-56.78, 12.34],
    place_name: '12.34, -56.78',
    place_type: ['coordinate'],
    properties: {
      coordinateSearch: true,
    },
    text: '12.34, -56.78',
  });
});

test('createCoordinateSearchResult: uses a custom result label formatter', () => {
  expect(
    createCoordinateSearchResult(
      '12.34, -56.78',
      ({ latitude, longitude }) => `Coordinates: ${latitude}, ${longitude}`
    )
  ).toEqual(
    expect.objectContaining({
      place_name: 'Coordinates: 12.34, -56.78',
      text: 'Coordinates: 12.34, -56.78',
    })
  );
});

test('getCoordinateSearchResults: returns an empty list for non-coordinate input', () => {
  expect(getCoordinateSearchResults('Quito, Ecuador')).toEqual([]);
});
