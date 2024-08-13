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

import bbox from '@turf/bbox';
import _ from 'lodash/fp';
import { isValidLatitude, isValidLongitude } from 'terraso-client-shared/utils';

// From: https://gis.stackexchange.com/a/303362
export const normalizeLongitude = lng => (((lng % 360) + 540) % 360) - 180;

export const isGpxFile = file => file.name.endsWith('.gpx');

export const isKmlFile = file =>
  file.name.endsWith('.kml') || file.name.endsWith('.kmz');

export const isShapefile = file => file.name.endsWith('.zip');

const openFile = file =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = event => {
      const contents = event.target.result;
      resolve(contents);
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });

export const openGeoJsonFile = file =>
  openFile(file).then(contents => {
    if (!contents.length) {
      return Promise.reject('boundaries_file_empty');
    }

    try {
      const json = JSON.parse(contents);
      if (isValidGeoJson(json)) {
        return json;
      }
    } catch (error) {
      return Promise.reject('boundaries_file_invalid_json');
    }

    return Promise.reject('boundaries_file_invalid_geojson');
  });

export const parseGeoJson = areaPolygon => {
  if (!areaPolygon) {
    return null;
  }
  if (areaPolygon.bbox) {
    return areaPolygon.bbox;
  }
  try {
    const calculatedBbox = bbox(areaPolygon);
    if (calculatedBbox.every(_.isFinite)) {
      return calculatedBbox;
    }
    return null;
  } catch (error) {
    return null;
  }
};

export const isValidGeoJson = areaPolygon => !!parseGeoJson(areaPolygon);

export const isValidBounds = bounds => {
  if (!bounds) {
    return false;
  }
  const [swLng, swLat, neLng, neLat] = bounds;
  return (
    isValidLatitude(swLat) &&
    isValidLatitude(neLat) &&
    isValidLongitude(swLng) &&
    isValidLongitude(neLng)
  );
};
