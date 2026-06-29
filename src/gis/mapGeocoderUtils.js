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

import { isValidLatitude, isValidLongitude } from 'terraso-client-shared/utils';

const COORDINATE_QUERY_PATTERN =
  /^\s*([+-]?(?:\d+(?:\.\d+)?|\.\d+))\s*,\s*([+-]?(?:\d+(?:\.\d+)?|\.\d+))\s*$/;

export const parseCoordinateQuery = query => {
  if (!query) {
    return null;
  }

  const matches = query.match(COORDINATE_QUERY_PATTERN);
  if (!matches) {
    return null;
  }

  const latitude = Number(matches[1]);
  const longitude = Number(matches[2]);

  if (!isValidLatitude(latitude) || !isValidLongitude(longitude)) {
    return null;
  }

  return { latitude, longitude };
};

const formatCoordinateSearchLabel = ({ latitude, longitude }) =>
  `${latitude}, ${longitude}`;

const formatCoordinateQueryValue = ({ latitude, longitude }) =>
  `${latitude}, ${longitude}`;

export const createCoordinateSearchResult = (
  query,
  resultLabelFormatter = formatCoordinateSearchLabel
) => {
  const coordinates = parseCoordinateQuery(query);
  if (!coordinates) {
    return null;
  }

  const { latitude, longitude } = coordinates;
  const label = resultLabelFormatter({ latitude, longitude });

  return {
    type: 'Feature',
    geometry: {
      type: 'Point',
      coordinates: [longitude, latitude],
    },
    center: [longitude, latitude],
    place_name: label,
    place_type: ['coordinate'],
    properties: {
      coordinateSearch: true,
      coordinateQuery: formatCoordinateQueryValue({ latitude, longitude }),
    },
    text: label,
  };
};

export const getCoordinateSearchResults = (
  query,
  resultLabelFormatter = formatCoordinateSearchLabel
) => {
  const result = createCoordinateSearchResult(query, resultLabelFormatter);
  return result ? [result] : [];
};
