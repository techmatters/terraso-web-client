import _ from 'lodash'

import * as terrasoApi from 'terrasoBackend/api'
import * as gisService from 'gis/gisService'

const LANDSCAPE_DEFAULT_FIELDS = `
  id
  slug
  name
  location
  description
  website
`

const cleanLandscape = landscape => _.omit(landscape, 'slug')

export const fetchLandscapeToUpdate = slug => {
  const query = `query landscapes($slug: String!){
    landscapes(slug: $slug) {
      edges {
        node { ${LANDSCAPE_DEFAULT_FIELDS} }
      }
    }
  }`
  return terrasoApi
    .request(query, { slug })
    .then(response => _.get(response, 'landscapes.edges[0].node'))
    .then(landscape => landscape || Promise.reject('landscape.not_found'))
}

const getDefaultGroup = landscape => {
  const group = _.get(landscape, 'defaultGroup.edges[0].node.group')
  return _.pick(group, ['id', 'slug'], {})
}

export const fetchLandscapeToView = slug => {
  const query = `query landscapes($slug: String!){
    landscapes(slug: $slug) {
      edges {
        node {
          ${LANDSCAPE_DEFAULT_FIELDS}
          defaultGroup: associatedGroups(isDefaultLandscapeGroup: true) {
            edges {
              node {
                group {
                  id
                  slug
                }
              }
            }
          }
        }
      }
    }
  }`
  return terrasoApi
    .request(query, { slug })
    .then(response => _.get(response, 'landscapes.edges[0].node'))
    .then(landscape => landscape || Promise.reject('landscape.not_found'))
    .then(landscape => ({
      ..._.omit(landscape, 'defaultGroup'),
      group: getDefaultGroup(landscape)
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
        node { ${LANDSCAPE_DEFAULT_FIELDS} }
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
      landscape { ${LANDSCAPE_DEFAULT_FIELDS} }
    }
  }`
  return terrasoApi
    .request(query, { input: cleanLandscape(landscape) })
    .then(response => response.updateLandscape.landscape)
}

const addLandscape = landscape => {
  const query = `mutation addLandscape($input: LandscapeAddMutationInput!){
    addLandscape(input: $input) {
      landscape { ${LANDSCAPE_DEFAULT_FIELDS} }
    }
  }`
  return terrasoApi
    .request(query, { input: cleanLandscape(landscape) })
    .then(response => response.addLandscape.landscape)
}

export const saveLandscape = landscape => landscape.id
  ? updateLandscape(landscape)
  : addLandscape(landscape)
