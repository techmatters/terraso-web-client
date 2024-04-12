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
import turfCenter from '@turf/center';
import * as turf from '@turf/helpers';
import _ from 'lodash/fp';
import { useTranslation } from 'react-i18next';
import {
  extractAccountMembership,
  extractMembershipInfo,
} from 'terraso-client-shared/collaboration/membershipsUtils';
import { Typography } from '@mui/material';

import { countryNameForCode } from 'common/countries';
import * as gisService from 'gis/gisService';
import { normalizeLongitude, parseGeoJson } from 'gis/gisUtils';
import { extractSharedResources } from 'sharedData/sharedDataUtils';
import { extractTerms } from 'taxonomies/taxonomiesUtils';

import { ALL_PARTNERSHIP_STATUS } from './landscapeConstants';

// Returns bounding box containing the defined areaPolygon data or
// the bounding box requested from the landsace.location data
export const getLandscapeBoundingBox = (landscape = {}) => {
  const { areaPolygon, boundingBox: defaultBoundingBox } = landscape;

  const areaBoundingBox = areaPolygon && parseGeoJson(areaPolygon);

  if (areaBoundingBox) {
    return [
      [areaBoundingBox[0], areaBoundingBox[1]],
      [areaBoundingBox[2], areaBoundingBox[3]],
    ];
  }

  if (defaultBoundingBox) {
    return [
      [defaultBoundingBox[2], defaultBoundingBox[1]],
      [defaultBoundingBox[3], defaultBoundingBox[0]],
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

  if (landscape.centerCoordinates) {
    return [landscape.centerCoordinates.lat, landscape.centerCoordinates.lng];
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

const extractLandscapeGeoJson = landscape => {
  if (!landscape.areaPolygon) {
    return null;
  }

  try {
    return JSON.parse(landscape.areaPolygon);
  } catch (error) {
    return null;
  }
};

export const extractLandscape = async (landscape, useLocationApi) => {
  const result = {
    ..._.omit('membershipList', landscape),
    accountMembership: extractAccountMembership(landscape.membershipList),
    membershipInfo: extractMembershipInfo(landscape.membershipList),
    areaPolygon: extractLandscapeGeoJson(landscape),
    partnershipStatus: ALL_PARTNERSHIP_STATUS[landscape.partnershipStatus],
    partnership: extractPartnership(landscape),
    sharedResources: extractSharedResources(landscape),
    taxonomyTerms: extractTerms(_.get('taxonomyTerms.edges', landscape)),
    affiliatedGroups: extractAffiliatedGroups(landscape),
    developmentStrategy: extractDevelopmentStrategy(landscape),
  };

  if (!useLocationApi) {
    return result;
  }

  // Get bounding box from nominatim.openstreetmap.org if no areaPolygon data
  // AreaPolygon is not present when the user decided to skip it in the
  // landscape creation process as part of the wizard steps
  const currentCountry = countryNameForCode(result.location);

  if (!currentCountry) {
    return result;
  }

  return gisService
    .getPlaceInfoByName(currentCountry.name)
    .then(placeInfo => ({
      ...result,
      boundingBox: placeInfo?.boundingbox,
    }))
    .catch(() => result);
};

export const Subheader = ({ id, text }) => {
  const { t } = useTranslation();
  return (
    <Typography id={id} sx={{ pl: 2 }}>
      {t(text)}
    </Typography>
  );
};
