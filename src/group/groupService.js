import _ from 'lodash'

import * as terrasoApi from 'terrasoBackend/api'
import { accountMembership, groupFields, groupMembers } from 'group/groupFragments'
import { extractAccountMembership, extractMembers } from './groupUtils'

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

export const fetchGroupToView = (slug, currentUser) => {
  const query = `
    query group($slug: String!, $accountEmail: String!){
      groups(slug: $slug) {
        edges {
          node {
            ...groupFields
            ...groupMembers
            ...accountMembership
          }
        }
      }
    }
    ${groupFields}
    ${groupMembers}
    ${accountMembership}
  `
  return terrasoApi
    .request(query, { slug, accountEmail: currentUser.email })
    .then(response => _.get(response, 'groups.edges[0].node'))
    .then(group => group || Promise.reject('group.not_found'))
    .then(group => ({
      ...group,
      members: extractMembers(group),
      accountMembership: extractAccountMembership(group)
    }))
}

export const fetchGroups = () => {
  const query = `
    query {
      independentGroups: groups(
        associatedLandscapes_Isnull: true
      ) {
        edges {
          node {
            ...groupFields
            ...groupMembers
          }
        }
      }
      landscapeGroups: groups(
        associatedLandscapes_IsDefaultLandscapeGroup: false
      ) {
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
    .then(response => [
      ..._.get(response, 'independentGroups.edges', []),
      ..._.get(response, 'landscapeGroups.edges', [])
    ])
    .then(groups => groups
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

const addGroup = ({ group, user }) => {
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
    // TODO Workaround to set group manager
    .then(group => joinGroup({
      groupSlug: group.slug,
      userEmail: user.email,
      userRole: 'manager'
    }))
}

export const saveGroup = ({ group, user }) => group.id
  ? updateGroup(group)
  : addGroup({ group, user })

export const joinGroup = ({ groupSlug, userEmail, userRole = 'member' }) => {
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
      input: { userEmail, groupSlug, userRole }
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
