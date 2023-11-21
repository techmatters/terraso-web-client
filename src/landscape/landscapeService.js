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
import {
  extractAccountMembership,
  extractMembersInfo,
} from 'terraso-client-shared/memberships/membershipsUtils';
import * as terrasoApi from 'terraso-client-shared/terrasoApi/api';
import { graphql } from 'terrasoApi/shared/graphqlSchema';

import { countryNameForCode } from 'common/countries';
import * as gisService from 'gis/gisService';
import { extractDataEntries } from 'sharedData/sharedDataUtils';
import { extractTerms } from 'taxonomies/taxonomiesUtils';

import { ALL_PARTNERSHIP_STATUS } from './landscapeConstants';
import {
  extractAffiliatedGroups,
  extractDevelopmentStrategy,
  extractPartnership,
} from './landscapeUtils';

const cleanLandscape = landscape =>
  _.flow(
    _.pick([
      'id',
      'name',
      'description',
      'website',
      'email',
      'location',
      'areaPolygon',
      'areaTypes',
      'population',
      'taxonomyTypeTerms',
      'partnershipStatus',
      'partnership',
      'affiliatedGroups',
      'developmentStrategy',
      'profileImage',
      'profileImageDescription',
    ]),
    _.cloneWith(landscape => {
      const partnershipGroups =
        landscape.partnership && _.get('partnership.group.slug', landscape)
          ? [
              {
                slug: landscape.partnership.group.slug,
                partnershipYear: landscape.partnership.year || null,
                isPartnership: true,
              },
            ]
          : [];
      const affiliatedGroups = landscape.affiliatedGroups || [];
      if (_.isEmpty(partnershipGroups) && _.isEmpty(affiliatedGroups)) {
        if (
          _.has('partnership', landscape) ||
          _.has('affiliatedGroups', landscape)
        ) {
          return {
            ..._.omit(['partnership', 'affiliatedGroups'], landscape),
            groupAssociations: [],
          };
        }
        return landscape;
      }
      return {
        ..._.omit(['partnership', 'affiliatedGroups'], landscape),
        groupAssociations: [...partnershipGroups, ...affiliatedGroups],
      };
    }),
    _.toPairs,
    _.map(([key, value]) => {
      const jsonFields = [
        'areaPolygon',
        'areaTypes',
        'taxonomyTypeTerms',
        'developmentStrategy',
        'groupAssociations',
      ];
      if (_.includes(key, jsonFields)) {
        return [key, value ? JSON.stringify(value) : null];
      }
      if (key === 'population') {
        return [key, _.isEmpty(value) ? null : _.toInteger(value)];
      }
      return [key, value];
    }),
    _.fromPairs
  )(landscape);

export const fetchLandscapeToUpdate = slug => {
  const query = graphql(`
    query landscapesToUpdate($slug: String!) {
      landscapes(slug: $slug) {
        edges {
          node {
            ...landscapeProfileFields
            areaPolygon
          }
        }
      }
    }
  `);
  return terrasoApi
    .requestGraphQL(query, { slug })
    .then(_.get('landscapes.edges[0].node'))
    .then(landscape => landscape || Promise.reject('not_found'))
    .then(landscape => ({
      ...landscape,
      taxonomyTypeTerms: extractTerms(_.get('taxonomyTerms.edges', landscape)),
      partnershipStatus: ALL_PARTNERSHIP_STATUS[landscape.partnershipStatus],
      partnership: extractPartnership(landscape),
      affiliatedGroups: extractAffiliatedGroups(landscape),
      developmentStrategy: extractDevelopmentStrategy(landscape),
      areaPolygon: landscape.areaPolygon
        ? JSON.parse(landscape.areaPolygon)
        : null,
    }));
};

const getDefaultGroup = landscape => {
  const group = _.get('defaultGroup', landscape);
  return {
    ..._.pick(['id', 'slug'], group),
    membersInfo: extractMembersInfo(group),
  };
};

export const fetchLandscapeToView = slug => {
  const query = graphql(`
    query landscapesToView($slug: String!) {
      landscapes(slug: $slug) {
        edges {
          node {
            ...landscapeFields
            ...landscapePartnershipField
            ...defaultGroupWithMembersSample
            ...landscapeDataEntries
            areaPolygon
          }
        }
      }
    }
  `);
  return terrasoApi
    .requestGraphQL(query, {
      slug,
    })
    .then(_.get('landscapes.edges[0].node'))
    .then(landscape => landscape || Promise.reject('not_found'))
    .then(landscape => ({
      ..._.omit('defaultGroup', landscape),
      defaultGroup: getDefaultGroup(landscape),
    }))
    .then(landscape => ({
      ...landscape,
      areaPolygon: landscape.areaPolygon
        ? JSON.parse(landscape.areaPolygon)
        : null,
      partnershipStatus: ALL_PARTNERSHIP_STATUS[landscape.partnershipStatus],
      partnership: extractPartnership(landscape),
      dataEntries: extractDataEntries(landscape),
    }))
    .then(landscape => {
      if (landscape.areaPolygon || !landscape.location) {
        return landscape;
      }

      // Get bounding box from nominatim.openstreetmap.org if no areaPolygon data
      // AreaPolygon is not present when the user decided to skip it.
      const currentCountry = countryNameForCode(landscape.location);

      if (!currentCountry) {
        return landscape;
      }

      return gisService
        .getPlaceInfoByName(currentCountry.name)
        .then(placeInfo => ({
          ...landscape,
          boundingBox: placeInfo?.boundingbox,
        }))
        .catch(() => landscape);
    });
};

export const fetchLandscapeProfile = slug => {
  const query = graphql(`
    query landscapesProfiles($slug: String!) {
      landscapes(slug: $slug) {
        edges {
          node {
            ...landscapeProfileFields
            ...defaultGroup
          }
        }
      }
    }
  `);
  return terrasoApi
    .requestGraphQL(query, { slug })
    .then(_.get('landscapes.edges[0].node'))
    .then(landscape => landscape || Promise.reject('not_found'))
    .then(landscape => ({
      ..._.omit('defaultGroup', landscape),
      defaultGroup: getDefaultGroup(landscape),
      taxonomyTerms: extractTerms(_.get('taxonomyTerms.edges', landscape)),
      partnershipStatus: ALL_PARTNERSHIP_STATUS[landscape.partnershipStatus],
      partnership: extractPartnership(landscape),
      affiliatedGroups: extractAffiliatedGroups(landscape),
      developmentStrategy: extractDevelopmentStrategy(landscape),
    }));
};

export const fetchLandscapeToUploadSharedData = slug => {
  const query = graphql(`
    query landscapesToUploadSharedData($slug: String!) {
      landscapes(slug: $slug) {
        edges {
          node {
            ...landscapeFields
            ...defaultGroup
          }
        }
      }
    }
  `);
  return terrasoApi
    .requestGraphQL(query, { slug })
    .then(_.get('landscapes.edges[0].node'))
    .then(landscape => landscape || Promise.reject('not_found'))
    .then(landscape => ({
      ..._.omit('defaultGroup', landscape),
      defaultGroup: getDefaultGroup(landscape),
    }));
};

export const fetchLandscapes = () => {
  const query = graphql(`
    query landscapes {
      landscapes {
        edges {
          node {
            ...landscapeFields
            ...landscapeMembershipList
            centerCoordinates {
              lat
              lng
            }
          }
        }
      }
    }
  `);
  return terrasoApi
    .requestGraphQL(query)
    .then(response => response.landscapes)
    .then(landscapes =>
      Promise.all(
        landscapes.edges
          .map(edge => edge.node)
          .map(landscape => extractLandscape(landscape, false))
      )
    )
    .then(_.orderBy([landscape => landscape.name.toLowerCase()], null));
};

export const fetchLandscapeForMembers = slug => {
  const query = graphql(`
    query landscapesForMembers($slug: String!) {
      landscapes(slug: $slug) {
        edges {
          node {
            ...landscapeFields
            defaultGroup {
              slug
              ...accountMembership
            }
          }
        }
      }
    }
  `);
  return terrasoApi
    .requestGraphQL(query, { slug })
    .then(_.get('landscapes.edges[0].node'))
    .then(landscape => landscape || Promise.reject('not_found'))
    .then(landscape => {
      const group = _.get('defaultGroup', landscape);
      return {
        ...landscape,
        accountMembership: extractAccountMembership(group),
        groupSlug: _.get('slug', group),
      };
    });
};

const updateLandscape = landscape => {
  const query = graphql(`
    mutation updateLandscape($input: LandscapeUpdateMutationInput!) {
      updateLandscape(input: $input) {
        landscape {
          ...landscapeProfileFields
        }
        errors
      }
    }
  `);
  return terrasoApi
    .requestGraphQL(query, { input: cleanLandscape(landscape) })
    .then(response => ({ new: false, ...response.updateLandscape.landscape }))
    .then(landscape => ({
      ...landscape,
      partnershipStatus: ALL_PARTNERSHIP_STATUS[landscape.partnershipStatus],
    }));
};

const addLandscape = landscape => {
  const query = graphql(`
    mutation addLandscape($input: LandscapeAddMutationInput!) {
      addLandscape(input: $input) {
        landscape {
          ...landscapeProfileFields
        }
        errors
      }
    }
  `);
  return terrasoApi
    .requestGraphQL(query, { input: cleanLandscape(landscape) })
    .then(response => ({ new: true, ...response.addLandscape.landscape }))
    .then(landscape => ({
      ...landscape,
      partnershipStatus: ALL_PARTNERSHIP_STATUS[landscape.partnershipStatus],
    }));
};

export const saveLandscape = ({ landscape }) =>
  landscape.id ? updateLandscape(landscape) : addLandscape(landscape);

export const uploadProfileImage = async ({
  landscapeSlug,
  blob,
  description,
}) => {
  const path = '/storage/landscape-profile-image';

  const body = new FormData();
  body.append('landscape', landscapeSlug);
  if (description) {
    body.append('description', description);
  }
  body.append('data_file', blob);

  const jsonResponse = await terrasoApi.request({ path, body });

  if (_.has('error', jsonResponse)) {
    await Promise.reject(Object.values(jsonResponse.error).join('. '));
  }

  return jsonResponse;
};

export const leaveLandscapeFromList = ({ membershipId, landscapeSlug }) => {
  const query = graphql(`
    mutation leaveLandscapeFromList(
      $input: LandscapeMembershipDeleteMutationInput!
    ) {
      deleteLandscapeMembership(input: $input) {
        landscape {
          ...landscapeFields
          ...landscapeMembershipList
          centerCoordinates {
            lat
            lng
          }
        }
        errors
      }
    }
  `);
  return terrasoApi
    .requestGraphQL(query, {
      input: { id: membershipId, landscapeSlug },
    })
    .then(resp => resp.deleteLandscapeMembership.landscape)
    .then(landscape => extractLandscape(landscape, false));
};

export const joinLandscapeFromList = (
  { landscapeSlug },
  { email: accountEmail }
) => {
  const query = graphql(`
    mutation joinLandscapeFromList(
      $input: LandscapeMembershipSaveMutationInput!
    ) {
      saveLandscapeMembership(input: $input) {
        landscape {
          ...landscapeFields
          ...landscapeMembershipList
          centerCoordinates {
            lat
            lng
          }
        }
        errors
      }
    }
  `);
  return terrasoApi
    .requestGraphQL(query, {
      input: {
        landscapeSlug,
        userEmails: [accountEmail],
        userRole: MEMBERSHIP_ROLE_MEMBER,
      },
    })
    .then(resp => resp.saveLandscapeMembership.landscape)
    .then(landscape => extractLandscape(landscape, false));
};
