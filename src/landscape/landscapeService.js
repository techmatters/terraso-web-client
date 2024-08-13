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
import { extractMembership } from 'terraso-client-shared/collaboration/membershipsUtils';
import * as terrasoApi from 'terraso-client-shared/terrasoApi/api';
import { graphql } from 'terrasoApi/shared/graphqlSchema';

import {
  ALL_PARTNERSHIP_STATUS,
  MEMBERSHIP_ROLE_MEMBER,
} from 'landscape/landscapeConstants';
import {
  extractAffiliatedGroups,
  extractDevelopmentStrategy,
  extractLandscape,
  extractPartnership,
} from 'landscape/landscapeUtils';
import { extractTerms } from 'taxonomies/taxonomiesUtils';

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

export const fetchLandscapeToView = (slug, { email: accountEmail }) => {
  const query = graphql(`
    query landscapesToView($slug: String!, $accountEmail: String!) {
      landscapes(slug: $slug) {
        edges {
          node {
            ...landscapeFields
            ...landscapePartnershipField
            ...landscapeDataEntries
            ...landscapeMembershipListWithMembersSample
            areaPolygon
          }
        }
      }
    }
  `);
  return terrasoApi
    .requestGraphQL(query, { slug, accountEmail })
    .then(_.get('landscapes.edges[0].node'))
    .then(landscape => landscape || Promise.reject('not_found'))
    .then(landscape => extractLandscape(landscape, false));
};

export const fetchLandscapeProfile = slug => {
  const query = graphql(`
    query landscapesProfiles($slug: String!) {
      landscapes(slug: $slug) {
        edges {
          node {
            ...landscapeProfileFields
            ...landscapeMembershipList
          }
        }
      }
    }
  `);
  return terrasoApi
    .requestGraphQL(query, { slug })
    .then(_.get('landscapes.edges[0].node'))
    .then(landscape => landscape || Promise.reject('not_found'))
    .then(landscape => extractLandscape(landscape, false));
};

export const fetchLandscapeToUploadSharedData = slug => {
  const query = graphql(`
    query landscapesToUploadSharedData($slug: String!) {
      landscapes(slug: $slug) {
        edges {
          node {
            ...landscapeFields
            ...landscapeMembershipList
          }
        }
      }
    }
  `);
  return terrasoApi
    .requestGraphQL(query, { slug })
    .then(_.get('landscapes.edges[0].node'))
    .then(landscape => landscape || Promise.reject('not_found'))
    .then(extractLandscape);
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
            membershipList {
              ...collaborationMemberships
              ...accountCollaborationMembership
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
    .then(extractLandscape);
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

export const leaveLandscape = (
  { membershipId, landscapeSlug },
  { email: accountEmail }
) => {
  const query = graphql(`
    mutation deleteLandscapeMembership(
      $input: LandscapeMembershipDeleteMutationInput!
      $accountEmail: String!
    ) {
      deleteLandscapeMembership(input: $input) {
        landscape {
          ...landscapeFields
          ...landscapePartnershipField
          ...landscapeDataEntries
          ...landscapeMembershipListWithMembersSample
          areaPolygon
        }
        errors
      }
    }
  `);
  return terrasoApi
    .requestGraphQL(query, {
      input: { id: membershipId, landscapeSlug },
      accountEmail,
    })
    .then(resp => resp.deleteLandscapeMembership.landscape)
    .then(landscape => extractLandscape(landscape, false));
};

export const joinLandscape = ({ landscapeSlug }, { email: accountEmail }) => {
  const query = graphql(`
    mutation joinLandscape(
      $input: LandscapeMembershipSaveMutationInput!
      $accountEmail: String!
    ) {
      saveLandscapeMembership(input: $input) {
        landscape {
          ...landscapeFields
          ...landscapePartnershipField
          ...landscapeDataEntries
          ...landscapeMembershipListWithMembersSample
          areaPolygon
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
      accountEmail,
    })
    .then(resp => resp.saveLandscapeMembership.landscape)
    .then(landscape => extractLandscape(landscape, false));
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

export const changeMemberRole = ({ landscapeSlug, userRole, email }) => {
  const query = graphql(`
    mutation changeMemberRole($input: LandscapeMembershipSaveMutationInput!) {
      saveLandscapeMembership(input: $input) {
        memberships {
          ...collaborationMembershipFields
        }
        errors
      }
    }
  `);
  return terrasoApi
    .requestGraphQL(query, {
      input: {
        landscapeSlug,
        userEmails: [email],
        userRole,
      },
    })
    .then(resp => resp.saveLandscapeMembership.memberships[0])
    .then(extractMembership);
};

export const removeMember = ({ membershipId, landscapeSlug }) => {
  const query = graphql(`
    mutation removeMember($input: LandscapeMembershipDeleteMutationInput!) {
      deleteLandscapeMembership(input: $input) {
        membership {
          ...collaborationMembershipFields
        }
        errors
      }
    }
  `);
  return terrasoApi
    .requestGraphQL(query, {
      input: { id: membershipId, landscapeSlug },
    })
    .then(resp => resp.deleteLandscapeMembership.membership)
    .then(extractMembership);
};
