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

import _ from 'lodash/fp';
import logger from 'terraso-client-shared/monitoring/logger';
import * as terrasoApi from 'terraso-client-shared/terrasoApi/api';

import {
  isGpxFile,
  isKmlFile,
  isShapefile,
  openGeoJsonFile,
} from 'terraso-web-client/gis/gisUtils';

const generateUrl = name =>
  `https://nominatim.openstreetmap.org/search.php?q=${name}&format=jsonv2`;

export const getPlaceInfoByName = name =>
  fetch(generateUrl(name))
    .then(response => response.json())
    .then(_.get('[0]'))
    .catch(error => {
      logger.error(
        'Failed to request data from nominatim.openstreetmap.org API',
        'Name:',
        name,
        'Error:',
        error
      );
      return Promise.reject('gis.openstreetmap_api_error');
    });

const sendFileToTerrasoApi = async file => {
  const path = '/gis/parse/';
  const body = new FormData();
  body.append('file', file);
  const jsonResponse = await terrasoApi.request({ path, body });

  if (_.has('error', jsonResponse)) {
    await Promise.reject(Object.values(jsonResponse.error).join('. '));
  }

  return jsonResponse.geojson;
};

export const parseFileToGeoJSON = async file => {
  return isKmlFile(file) || isShapefile(file) || isGpxFile(file)
    ? sendFileToTerrasoApi(file)
    : openGeoJsonFile(file);
};
