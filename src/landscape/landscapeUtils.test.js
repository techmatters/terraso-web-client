import { getLandscapeBoundingBox } from 'landscape/landscapeUtils';

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
    [39, -100],
    [39, -100],
  ]);
});

test('Landscape Utils: get bounding box by position', () => {
  const landscape = {
    areaPolygon: null,
    position: {
      boundingbox: [1, 2, 3, 4],
    },
  };
  const boundingBox = getLandscapeBoundingBox(landscape);

  expect(boundingBox).toStrictEqual([
    [2, 1],
    [4, 3],
  ]);
});

test('Landscape Utils: get bounding box without area nor position', () => {
  const landscape = {
    areaPolygon: null,
    position: null,
  };
  const boundingBox = getLandscapeBoundingBox(landscape);

  expect(boundingBox).toBeFalsy();
});
