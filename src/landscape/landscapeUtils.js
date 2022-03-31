import bbox from '@turf/bbox';

const parseGeoJson = areaPolygon => {
  if (!areaPolygon) {
    return null;
  }
  try {
    return bbox(areaPolygon);
  } catch (error) {
    return null;
  }
};

export const getLandscapeBoundingBox = (landscape = {}) => {
  const { areaPolygon, position } = landscape;

  const areaBoundingBox = areaPolygon && parseGeoJson(areaPolygon);
  const positionBoundingBox = position && position.boundingbox;

  const boundingBox = areaBoundingBox || positionBoundingBox;

  return (
    boundingBox && [
      [boundingBox[1], boundingBox[0]],
      [boundingBox[3], boundingBox[2]],
    ]
  );
};

export const isValidGeoJson = areaPolygon => !!parseGeoJson(areaPolygon);
