import _ from 'lodash'

import * as terrasoApi from 'terrasoBackend/api'

// Omitted email because it is not supported by the backend
const cleanGroup = group => _.omit(group, 'email')

export const fetchGroup = id => terrasoApi
  .request(`request group($id: ID!){
    group(id: $id) {
      id
      name
      description
      website
    }
  }`, { id })
  .then(response => !response.group
    ? Promise.reject('group.not_found')
    : response.group
  )

export const fetchGroups = () => terrasoApi
  .request(`request {
    groups {
      edges {
        node {
          id
          name
          description
          website
        }
      }
    }
  }`)
  .then(response => response.groups)
  .then(groups => groups.edges.map(edge => edge.node))

const updateGroup = group => terrasoApi
  .request(`mutation updateGroup($input: GroupUpdateMutationInput!) {
    updateGroup(input: $input) {
      group {
        id
        name
        description
        website
      }
    }
  }`, {
    input: cleanGroup(group)
  })
  .then(response => response.updateGroup.group)

const addGroup = group => terrasoApi
  .request(`mutation addGroup($input: GroupAddMutationInput!){
    addGroup(input: $input) {
      group {
        id
        name
        description
        website
      }
    }
  }`, {
    input: cleanGroup(group)
  })
  .then(response => response.addGroup.group)

export const saveGroup = group => group.id
  ? updateGroup(group)
  : addGroup(group)
