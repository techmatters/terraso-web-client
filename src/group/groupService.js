import _ from 'lodash'

import * as terrasoApi from 'terrasoBackend/api'
import { groupFields, groupMembers } from 'group/groupFragments'
import { extractMembers } from './groupUtils'

// Omitted email because it is not supported by the backend
const cleanGroup = group => _.omit(group, 'slug')

export const fetchGroupToUpdate = slug => {
  const query = `
    query group($slug: String!){
      groups(slug: $slug) {
        edges {
          node {
            ...groupFields
          }
        }
      }
    }
    ${groupFields}
  `
  return terrasoApi
    .request(query, { slug })
    .then(response => _.get(response, 'groups.edges[0].node'))
    .then(group => group || Promise.reject('group.not_found'))
}

export const fetchGroupToView = slug => {
  const query = `
    query group($slug: String!){
      groups(slug: $slug) {
        edges {
          node {
            ...groupFields
            ...groupMembers
          }
        }
      }
    }
    ${groupFields}
    ${groupMembers}
  `
  return terrasoApi
    .request(query, { slug })
    .then(response => _.get(response, 'groups.edges[0].node'))
    .then(group => group || Promise.reject('group.not_found'))
    .then(group => ({
      ...group,
      members: extractMembers(group)
    }))
}

export const fetchGroups = () => {
  const query = `
    query {
      groups(associatedLandscapes_Isnull:true) {
        edges {
          node {
            ...groupFields
            ...groupMembers
          }
        }
      }
    }
    ${groupFields}
    ${groupMembers}
  `
  return terrasoApi
    .request(query)
    .then(response => response.groups)
    .then(groups => groups.edges
      .map(edge => ({
        ..._.omit(edge.node, 'memberships'),
        members: extractMembers(edge.node)
      }))
    )
    .then(groups => _.orderBy(groups, [group => group.name.toLowerCase()]))
}

const updateGroup = group => {
  const query = `
    mutation updateGroup($input: GroupUpdateMutationInput!) {
      updateGroup(input: $input) {
        group { ...groupFields }
      }
    }
    ${groupFields}
  `
  return terrasoApi
    .request(query, { input: cleanGroup(group) })
    .then(response => response.updateGroup.group)
}

const addGroup = group => {
  const query = `
    mutation addGroup($input: GroupAddMutationInput!){
      addGroup(input: $input) {
        group { ...groupFields }
      }
    }
    ${groupFields}
  `
  return terrasoApi
    .request(query, { input: cleanGroup(group) })
    .then(response => response.addGroup.group)
}

export const saveGroup = group => group.id
  ? updateGroup(group)
  : addGroup(group)

export const joinGroup = ({ groupSlug, userEmail }) => {
  const query = `
    mutation addMembership($input: MembershipAddMutationInput!){
      addMembership(input: $input) {
        membership {
          group { 
            ...groupFields
            ...groupMembers
          }
        }
      }
    }
    ${groupFields}
    ${groupMembers}
  `
  return terrasoApi
    .request(query, {
      input: { userEmail, groupSlug, userRole: 'member' }
    })
    .then()
    .then(response => _.get(response, 'addMembership.membership.group'))
    .then(group => group || Promise.reject('group.not_found'))
    .then(group => ({
      ..._.omit(group, 'memberships'),
      members: extractMembers(group)
    }))
}

export const leaveGroup = ({ groupSlug, membershipId }) => {
  const query = `
    mutation deleteMembership($input: MembershipDeleteMutationInput!){
      deleteMembership(input: $input) {
        membership {
          group { 
            ...groupFields
            ...groupMembers
          }
        }
      }
    }
    ${groupFields}
    ${groupMembers}
  `
  return terrasoApi
    .request(query, { input: { id: membershipId } })
    .then()
    .then(response => _.get(response, 'deleteMembership.membership.group'))
    .then(() => ({ groupSlug }))
}
