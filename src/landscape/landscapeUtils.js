import bbox from '@turf/bbox';

export const getLandscapeBoundingBox = landscape => {
  const { areaPolygon, position } = landscape;

  const areaBoundingBox = areaPolygon && bbox(areaPolygon);
  const positionBoundingBox = position && position.boundingbox;

  const boundingBox = areaBoundingBox || positionBoundingBox;

  return (
    boundingBox && [
      [boundingBox[1], boundingBox[0]],
      [boundingBox[3], boundingBox[2]],
    ]
  );
};
