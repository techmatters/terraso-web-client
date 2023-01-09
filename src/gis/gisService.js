import _ from 'lodash/fp';

import logger from 'monitoring/logger';

import { isKmlFile, isShapefile, openGeoJsonFile } from 'gis/gisUtils';
import * as terrasoApi from 'terrasoBackend/api';

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
  return isKmlFile(file) || isShapefile(file)
    ? sendFileToTerrasoApi(file)
    : openGeoJsonFile(file);
};
