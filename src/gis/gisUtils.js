import bbox from '@turf/bbox';
import _ from 'lodash/fp';

export const isValidLatitude = lat => lat >= -90 && lat <= 90;
export const isValidLongitude = lng => lng >= -180 && lng <= 180;

// From: https://gis.stackexchange.com/a/303362
export const normalizeLongitude = lng => (((lng % 360) + 540) % 360) - 180;

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
