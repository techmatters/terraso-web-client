import _ from 'lodash/fp';

import * as terrasoApi from 'terrasoBackend/api';
import * as gisService from 'gis/gisService';
import { landscapeFields, defaultGroup } from 'landscape/landscapeFragments';
import { extractMembers } from 'group/groupUtils';

const cleanLandscape = landscape => _.omit('slug', landscape);

export const fetchLandscapeToUpdate = slug => {
  const query = `
    query landscapes($slug: String!){
      landscapes(slug: $slug) {
        edges {
          node { ...landscapeFields }
        }
      }
    }
    ${landscapeFields}
  `;
  return terrasoApi
    .request(query, { slug })
    .then(_.get('landscapes.edges[0].node'))
    .then(landscape => landscape || Promise.reject('landscape.not_found'));
};

const getDefaultGroup = landscape => {
  const group = _.get('defaultGroup.edges[0].node.group', landscape);
  return {
    ..._.pick(['id', 'slug'], group),
    members: extractMembers(group),
  };
};

export const fetchLandscapeToView = slug => {
  const query = `
    query landscapes($slug: String!){
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
  return (
    terrasoApi
      .request(query, { slug })
      .then(_.get('landscapes.edges[0].node'))
      .then(landscape => landscape || Promise.reject('landscape.not_found'))
      .then(landscape => ({
        ..._.omit('defaultGroup', landscape),
        defaultGroup: getDefaultGroup(landscape),
      }))
      // TODO temporarily getting position from openstreetmap API.
      // This should change when we store landscape polygon.
      .then(landscape =>
        gisService.getPlaceInfoByName(landscape.location).then(placeInfo => ({
          ...landscape,
          position: placeInfo,
        }))
      )
  );
};

export const fetchLandscapes = () => {
  const query = `
    query {
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
    .request(query)
    .then(response => response.landscapes)
    .then(landscapes =>
      landscapes.edges
        .map(edge => edge.node)
        .map(landscape => ({
          ..._.omit(['defaultGroup'], landscape),
          defaultGroup: getDefaultGroup(landscape),
        }))
    )
    .then(landscapes =>
      _.orderBy(landscapes, null, [landscape => landscape.name.toLowerCase()])
    );
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
    .request(query, { input: cleanLandscape(landscape) })
    .then(response => response.updateLandscape.landscape);
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
    .request(query, { input: cleanLandscape(landscape) })
    .then(response => response.addLandscape.landscape);
};

export const saveLandscape = landscape =>
  landscape.id ? updateLandscape(landscape) : addLandscape(landscape);
