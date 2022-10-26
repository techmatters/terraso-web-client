import _ from 'lodash/fp';

import * as gisService from 'gis/gisService';
import { accountMembership } from 'group/groupFragments';
import { extractAccountMembership, extractMembersInfo } from 'group/groupUtils';
import {
  defaultGroup,
  landscapeFields,
  landscapeProfileFields,
} from 'landscape/landscapeFragments';
import { extractTerms } from 'taxonomies/taxonomiesUtils';
import * as terrasoApi from 'terrasoBackend/api';

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
      'location',
      'areaPolygon',
      'areaTypes',
      'population',
      'taxonomyTypeTerms',
      'partnershipStatus',
      'partnership',
      'affiliatedGroups',
      'developmentStrategy',
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
      if (key === 'population' && _.isEmpty(value)) {
        return [key, null];
      }
      return [key, value];
    }),
    _.fromPairs
  )(landscape);

export const fetchLandscapeToUpdate = slug => {
  const query = `
    query landscapes($slug: String!){
      landscapes(slug: $slug) {
        edges {
          node {
            ...landscapeFields
            ...landscapeProfileFields
          }
        }
      }
    }
    ${landscapeFields}
    ${landscapeProfileFields}
  `;
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
  const group = _.get('defaultGroup.edges[0].node.group', landscape);
  return {
    ..._.pick(['id', 'slug'], group),
    membersInfo: extractMembersInfo(group),
  };
};

export const fetchLandscapeToView = (slug, currentUser) => {
  const query = `
    query landscapes($slug: String!, $accountEmail: String!){
      landscapes(slug: $slug) {
        edges {
          node {
            ...landscapeFields
            ...defaultGroup
          }
        }
      }
    }
    ${landscapeFields}
    ${defaultGroup}
  `;
  return terrasoApi
    .requestGraphQL(query, { slug, accountEmail: currentUser.email })
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
    }))
    .then(landscape => {
      if (landscape.areaPolygon || !landscape.location) {
        return landscape;
      }

      // Get bounding box from nominatim.openstreetmap.org if no areaPolygon data
      // AreaPolygon is not present when the user decided to skip it.
      return gisService
        .getPlaceInfoByName(landscape.location)
        .then(placeInfo => ({
          ...landscape,
          boundingBox: placeInfo?.boundingbox,
        }));
    });
};

export const fetchLandscapeProfile = (slug, currentUser) => {
  const query = `
    query landscapes($slug: String!, $accountEmail: String!){
      landscapes(slug: $slug) {
        edges {
          node {
            ...landscapeFields
            ...landscapeProfileFields
            ...defaultGroup
          }
        }
      }
    }
    ${landscapeFields}
    ${landscapeProfileFields}
    ${defaultGroup}
  `;
  return terrasoApi
    .requestGraphQL(query, { slug, accountEmail: currentUser.email })
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

export const fetchLandscapeToUploadSharedData = (slug, currentUser) => {
  const query = `
    query landscapes($slug: String!, $accountEmail: String!){
      landscapes(slug: $slug) {
        edges {
          node {
            ...landscapeFields
            ...defaultGroup
          }
        }
      }
    }
    ${landscapeFields}
    ${defaultGroup}
  `;
  return terrasoApi
    .requestGraphQL(query, { slug, accountEmail: currentUser.email })
    .then(_.get('landscapes.edges[0].node'))
    .then(landscape => landscape || Promise.reject('not_found'))
    .then(landscape => ({
      ..._.omit('defaultGroup', landscape),
      defaultGroup: getDefaultGroup(landscape),
    }));
};

export const fetchLandscapes = (params, currentUser) => {
  const query = `
    query landscapes($accountEmail: String!){
      landscapes {
        edges {
          node {
            ...landscapeFields
            ...defaultGroup
          }
        }
      }
    }
    ${landscapeFields}
    ${defaultGroup}
  `;
  return terrasoApi
    .requestGraphQL(query, { accountEmail: currentUser.email })
    .then(response => response.landscapes)
    .then(landscapes =>
      landscapes.edges
        .map(edge => edge.node)
        .map(landscape => ({
          ..._.omit(['defaultGroup'], landscape),
          defaultGroup: getDefaultGroup(landscape),
          areaPolygon: landscape.areaPolygon
            ? JSON.parse(landscape.areaPolygon)
            : null,
        }))
    )
    .then(_.orderBy([landscape => landscape.name.toLowerCase()], null));
};

export const fetchLandscapeForMembers = (slug, currentUser) => {
  const query = `
    query landscapes($slug: String!, $accountEmail: String!){
      landscapes(slug: $slug) {
        edges {
          node {
            ...landscapeFields
            associatedGroups(isDefaultLandscapeGroup: true) {
              edges {
                node {
                  group {
                    slug
                    ...accountMembership
                  }
                }
              }
            }
          }
        }
      }
    }
    ${landscapeFields}
    ${accountMembership}
  `;
  return terrasoApi
    .requestGraphQL(query, { slug, accountEmail: currentUser.email })
    .then(_.get('landscapes.edges[0].node'))
    .then(landscape => landscape || Promise.reject('not_found'))
    .then(landscape => {
      const group = _.get('associatedGroups.edges[0].node.group', landscape);
      return {
        ...landscape,
        accountMembership: extractAccountMembership(group),
        groupSlug: _.get('slug', group),
      };
    });
};

const updateLandscape = landscape => {
  const query = `
    mutation updateLandscape($input: LandscapeUpdateMutationInput!) {
      updateLandscape(input: $input) {
        landscape {
          ...landscapeFields
        }
      }
    }
    ${landscapeFields}
  `;
  return terrasoApi
    .requestGraphQL(query, { input: cleanLandscape(landscape) })
    .then(response => ({ new: false, ...response.updateLandscape.landscape }));
};

const addLandscape = landscape => {
  const query = `
    mutation addLandscape($input: LandscapeAddMutationInput!){
      addLandscape(input: $input) {
        landscape {
          ...landscapeFields
        }
      }
    }
    ${landscapeFields}
  `;
  return terrasoApi
    .requestGraphQL(query, { input: cleanLandscape(landscape) })
    .then(response => ({ new: true, ...response.addLandscape.landscape }));
};

export const saveLandscape = landscape =>
  landscape.id ? updateLandscape(landscape) : addLandscape(landscape);
