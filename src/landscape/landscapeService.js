import _ from 'lodash'

import * as terrasoApi from 'terrasoBackend/api'
import * as gisService from 'gis/gisService'

export const fetchLandscapeToUpdate = id => {
  const query = `query landscape($id: ID!){
    landscape(id: $id) {
      id
      name
      description
      website
    }
  }`
  return terrasoApi
    .request(query, { id })
    .then(response => !response.landscape
      ? Promise.reject('landscape.not_found')
      : response.landscape
    )
}

export const fetchLandscapeToView = id => {
  const query = `query landscape($id: ID!){
    landscape(id: $id) {
      id
      slug
      name
      location
      description
      website
      defaultGroup: associatedGroups(isDefaultLandscapeGroup: true) {
        edges {
          node {
            group {
              slug
              memberships {
                edges {
                  node {
                    user {
                      firstName
                      lastName
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }`
  return terrasoApi
    .request(query, { id })
    .then(response => response.landscape
      ? response.landscape
      : Promise.reject('landscape.not_found')
    )
    .then(landscape => ({
      ..._.omit(landscape, 'defaultGroup'),
      members: _.get(landscape, 'defaultGroup.edges[0].node.group.memberships.edges', [])
        .map(edge => _.get(edge, 'node.user'))
    }))
    // TODO temporarily getting position from openstreetmap API.
    // This should change when we store landscape polygon.
    .then(landscape => gisService.getPlaceInfoByName(landscape.location)
      .then(placeInfo => ({
        ...landscape,
        position: placeInfo
      }))
    )
}

export const fetchLandscapes = () => {
  const query = `query {
    landscapes {
      edges {
        node {
          id
          name
          description
          website
        }
      }
    }
  }`
  return terrasoApi
    .request(query)
    .then(response => response.landscapes)
    .then(landscapes => landscapes.edges.map(edge => edge.node))
}

const updateLandscape = landscape => {
  const query = `mutation updateLandscape($input: LandscapeUpdateMutationInput!) {
    updateLandscape(input: $input) {
      landscape {
        id
        name
        description
        website
      }
    }
  }`
  return terrasoApi
    .request(query, { input: landscape })
    .then(response => response.updateLandscape.landscape)
}

const addLandscape = landscape => {
  const query = `mutation addLandscape($input: LandscapeAddMutationInput!){
    addLandscape(input: $input) {
      landscape {
        id
        name
        description
        website
      }
    }
  }`
  return terrasoApi
    .request(query, { input: landscape })
    .then(response => response.addLandscape.landscape)
}

export const saveLandscape = landscape => landscape.id
  ? updateLandscape(landscape)
  : addLandscape(landscape)
