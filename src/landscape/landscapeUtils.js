import bbox from '@turf/bbox';
import turfCenter from '@turf/center';
import * as turf from '@turf/helpers';
import _ from 'lodash/fp';
import { useTranslation } from 'react-i18next';

import { Typography } from '@mui/material';

import { normalizeLongitude } from 'gis/gisUtils';

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

// Returns bounding box containing the defined areaPolygon data or
// the bounding box requested from the landsace.location data
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

export const isBoundaryPin = landscape => {
  if (!landscape) {
    return false;
  }

  const features = _.getOr([], 'areaPolygon.features', landscape);

  if (_.isEmpty(features) || _.size(features) > 1) {
    return false;
  }

  return _.get('[0].geometry.type', features) === 'Point';
};

export const getLandscapePin = landscape => {
  if (!landscape) {
    return null;
  }

  const point = (() => {
    const isPin = isBoundaryPin(landscape);

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

    const center = turfCenter(
      turf.points([
        [boundingBox[0], boundingBox[1]],
        [boundingBox[2], boundingBox[3]],
      ])
    );
    return [center.geometry.coordinates[1], center.geometry.coordinates[0]];
  })();

  if (!point) {
    return null;
  }

  return [point[0], normalizeLongitude(point[1])];
};

export const isValidGeoJson = areaPolygon => !!parseGeoJson(areaPolygon);

export const extractPartnership = landscape =>
  _.flow(
    _.map(_.get('node')),
    _.filter(_.get('isPartnership')),
    _.map(groupAssociation => ({
      year: groupAssociation.partnershipYear,
      group: groupAssociation.group,
    })),
    _.head
  )(_.get('associatedGroups.edges', landscape));

export const extractAffiliatedGroups = landscape =>
  _.flow(
    _.map(_.get('node')),
    _.filter(groupAssociation => !groupAssociation.isPartnership),
    _.map(_.get('group'))
  )(_.get('associatedGroups.edges', landscape));

export const extractDevelopmentStrategy = landscape =>
  _.get('associatedDevelopmentStrategy.edges[0].node', landscape);

export const Subheader = ({ id, text }) => {
  const { t } = useTranslation();
  return (
    <Typography id={id} sx={{ pl: 2 }}>
      {t(text)}
    </Typography>
  );
};
