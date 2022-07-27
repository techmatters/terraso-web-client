import bbox from '@turf/bbox';
import _ from 'lodash/fp';

const parseGeoJson = areaPolygon => {
  if (!areaPolygon) {
    return null;
  }
  try {
    return areaPolygon.bbox || bbox(areaPolygon);
  } catch (error) {
    return null;
  }
};

export const getLandscapeBoundingBox = (landscape = {}) => {
  const { areaPolygon, boundingBox: defaultBoundingBox } = landscape;

  const areaBoundingBox = areaPolygon && parseGeoJson(areaPolygon);

  if (areaBoundingBox) {
    return [
      [areaBoundingBox[1], areaBoundingBox[0]],
      [areaBoundingBox[3], areaBoundingBox[2]],
    ];
  }

  if (defaultBoundingBox) {
    return [
      [defaultBoundingBox[1], defaultBoundingBox[2]],
      [defaultBoundingBox[0], defaultBoundingBox[3]],
    ];
  }
};

export const getLandscapePin = landscape => {
  if (!landscape) {
    return null;
  }

  const isPin =
    _.get('areaPolygon.features[0].geometry.type', landscape) === 'Point';

  if (isPin) {
    return _.flow(
      _.get('areaPolygon.features[0].geometry.coordinates'),
      _.reverse
    )(landscape);
  }

  const { areaPolygon, position } = landscape;

  const areaBoundingBox = areaPolygon && parseGeoJson(areaPolygon);
  const positionBoundingBox = position && position.boundingbox;

  const boundingBox = areaBoundingBox || positionBoundingBox;

  if (!boundingBox) {
    return null;
  }

  const latDelta = boundingBox[1] + boundingBox[3];
  const lngDelta = boundingBox[0] + boundingBox[2];

  return [
    latDelta === 0 ? boundingBox[0] : latDelta / 2,
    lngDelta === 0 ? boundingBox[1] : lngDelta / 2,
  ];
};

export const isValidGeoJson = areaPolygon => !!parseGeoJson(areaPolygon);
