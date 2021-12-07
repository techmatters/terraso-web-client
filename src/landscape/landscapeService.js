import * as terrasoApi from 'terrasoBackend/api'

export const fetchLandscape = id => {
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
