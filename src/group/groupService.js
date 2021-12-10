import _ from 'lodash'

import * as terrasoApi from 'terrasoBackend/api'

const GROUP_DEFAULT_FIELDS = `
  id
  slug
  name
  description
  website
`

// Omitted email because it is not supported by the backend
const cleanGroup = group => _.omit(group, 'email')

export const fetchGroup = id => {
  const query = `query group($id: ID!){
    group(id: $id) { ${GROUP_DEFAULT_FIELDS} }
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
        node { ${GROUP_DEFAULT_FIELDS} }
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
      group { ${GROUP_DEFAULT_FIELDS} }
    }
  }`
  return terrasoApi
    .request(query, { input: cleanGroup(group) })
    .then(response => response.updateGroup.group)
}

const addGroup = group => {
  const query = `mutation addGroup($input: GroupAddMutationInput!){
    addGroup(input: $input) {
      group { ${GROUP_DEFAULT_FIELDS} }
    }
  }`
  return terrasoApi
    .request(query, { input: cleanGroup(group) })
    .then(response => response.addGroup.group)
}

export const saveGroup = group => group.id
  ? updateGroup(group)
  : addGroup(group)

const getMembers = memberships => _.get(memberships, 'edges', [])
  .map(edge => _.get(edge, 'node.user'))

export const fetchGroupMembership = slug => {
  const query = `query groups($slug: String!){
    groups(slug: $slug) {
      edges {
        node {
          ${GROUP_DEFAULT_FIELDS}
          memberships {
            edges {
              node {
                user {
                  email
                  firstName
                  lastName
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
    .then(response => _.get(response, 'groups.edges[0].node'))
    .then(group => group || Promise.reject('group.not_found'))
    .then(group => ({
      ..._.omit(group, 'memberships'),
      members: getMembers(group.memberships)
    }))
}
export const joinGroup = ({ groupSlug, userEmail }) => {
  const query = `mutation addMembership($input: MembershipAddMutationInput!){
    addMembership(input: $input) {
      membership {
        group { 
          ${GROUP_DEFAULT_FIELDS}
          memberships {
            edges {
              node {
                user {
                  email
                  firstName
                  lastName
                }
              }
            }
          }
        }
      }
    }
  }`
  return terrasoApi
    .request(query, {
      input: { userEmail, groupSlug, userRole: 'member' }
    })
    .then()
    .then(response => _.get(response, 'addMembership.membership.group'))
    .then(group => group || Promise.reject('group.not_found'))
    .then(group => ({
      ..._.omit(group, 'memberships'),
      members: getMembers(group.memberships)
    }))
}
