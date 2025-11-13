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

import { getLandscapeBoundingBox } from 'terraso-web-client/landscape/landscapeUtils';

test('Landscape Utils: get bounding box by area geojson', () => {
  const landscape = {
    areaPolygon: {
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [-100, 39],
      },
    },
    position: {},
  };
  const boundingBox = getLandscapeBoundingBox(landscape);

  expect(boundingBox).toStrictEqual([
    [-100, 39],
    [-100, 39],
  ]);
});

test('Landscape Utils: get bounding box by position', () => {
  const landscape = {
    areaPolygon: null,
    boundingBox: [1, 2, 3, 4],
  };
  const boundingBox = getLandscapeBoundingBox(landscape);

  expect(boundingBox).toStrictEqual([
    [3, 2],
    [4, 1],
  ]);
});

test('Landscape Utils: get bounding box without area nor position', () => {
  const landscape = {
    areaPolygon: null,
  };
  const boundingBox = getLandscapeBoundingBox(landscape);

  expect(boundingBox).toBeFalsy();
});
