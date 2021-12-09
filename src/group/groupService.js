import _ from 'lodash'

import * as terrasoApi from 'terrasoBackend/api'

// Omitted email because it is not supported by the backend
const cleanGroup = group => _.omit(group, 'email')

export const fetchGroup = id => {
  const query = `query group($id: ID!){
    group(id: $id) {
      id
      name
      description
      website
    }
  }`
  return terrasoApi
    .request(query, { id })
    .then(response => !response.group
      ? Promise.reject('group.not_found')
      : response.group
    )
}

export const fetchGroups = () => {
  const query = `query {
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
  }`
  return terrasoApi
    .request(query)
    .then(response => response.groups)
    .then(groups => groups.edges.map(edge => edge.node))
}

const updateGroup = group => {
  const query = `mutation updateGroup($input: GroupUpdateMutationInput!) {
    updateGroup(input: $input) {
      group {
        id
        name
        description
        website
      }
    }
  }`
  return terrasoApi
    .request(query, { input: cleanGroup(group) })
    .then(response => response.updateGroup.group)
}

const addGroup = group => {
  const query = `mutation addGroup($input: GroupAddMutationInput!){
    addGroup(input: $input) {
      group {
        id
        name
        description
        website
      }
    }
  }`
  return terrasoApi
    .request(query, { input: cleanGroup(group) })
    .then(response => response.addGroup.group)
}

export const saveGroup = group => group.id
  ? updateGroup(group)
  : addGroup(group)

export const joinGroup = ({ groupSlug, userEmail }) => {
  const query = `mutation addMembership($input: MembershipAddMutationInput!){
    addMembership(input: $input) {
      membership {
        id
      }
    }
  }`
  return terrasoApi
    .request(query, {
      input: { userEmail, groupSlug, userRole: 'member' }
    })
    .then(response => response.addGroup.group)
}
