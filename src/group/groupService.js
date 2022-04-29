import _ from 'lodash/fp';

import {
  accountMembership,
  groupFields,
  groupMembers,
  groupMembersInfo,
} from 'group/groupFragments';
import * as terrasoApi from 'terrasoBackend/api';

import {
  extractAccountMembership,
  extractMembers,
  extractMembersInfo,
} from './groupUtils';

// Omitted email because it is not supported by the backend
const cleanGroup = group => _.omit('slug', group);

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
  `;
  return terrasoApi
    .request(query, { slug })
    .then(_.get('groups.edges[0].node'))
    .then(group => group || Promise.reject('not_found'));
};

export const fetchGroupToView = (slug, currentUser) => {
  const query = `
    query group($slug: String!, $accountEmail: String!){
      groups(slug: $slug) {
        edges {
          node {
            ...groupFields
            ...groupMembersInfo
            ...accountMembership
          }
        }
      }
    }
    ${groupFields}
    ${groupMembersInfo}
    ${accountMembership}
  `;
  return terrasoApi
    .request(query, { slug, accountEmail: currentUser.email })
    .then(_.get('groups.edges[0].node'))
    .then(group => group || Promise.reject('not_found'))
    .then(group => ({
      ..._.omit(['memberships', 'accountMembership'], group),
      membersInfo: extractMembersInfo(group),
      accountMembership: extractAccountMembership(group),
    }));
};

export const fetchGroups = (params, currentUser) => {
  const query = `
    query groups($accountEmail: String!){
      independentGroups: groups(
        associatedLandscapes_Isnull: true
      ) {
        edges {
          node {
            ...groupFields
            ...groupMembersInfo
            ...accountMembership
          }
        }
      }
      landscapeGroups: groups(
        associatedLandscapes_IsDefaultLandscapeGroup: false
      ) {
        edges {
          node {
            ...groupFields
            ...groupMembersInfo
            ...accountMembership
          }
        }
      }
    }
    ${groupFields}
    ${groupMembersInfo}
    ${accountMembership}
  `;
  return terrasoApi
    .request(query, { accountEmail: currentUser.email })
    .then(response => [
      ..._.getOr([], 'independentGroups.edges', response),
      ..._.getOr([], 'landscapeGroups.edges', response),
    ])
    .then(groups =>
      groups.map(edge => ({
        ..._.omit(['memberships', 'accountMembership'], edge.node),
        membersInfo: extractMembersInfo(edge.node),
      }))
    )
    .then(_.orderBy([group => group.name.toLowerCase()], null));
};

export const fetchGroupForMembers = (slug, currentUser) => {
  const query = `
    query group($slug: String!, $accountEmail: String!){
      groups(slug: $slug) {
        edges {
          node {
            ...groupFields
            ...accountMembership
          }
        }
      }
    }
    ${groupFields}
    ${accountMembership}
  `;
  return terrasoApi
    .request(query, { slug, accountEmail: currentUser.email })
    .then(_.get('groups.edges[0].node'))
    .then(group => group || Promise.reject('not_found'))
    .then(group => ({
      ...group,
      accountMembership: extractAccountMembership(group),
    }));
};

export const fetchMembers = (slug, currentUser) => {
  const query = `
    query group($slug: String!){
      groups(slug: $slug) {
        edges {
          node {
            ...groupMembers
          }
        }
      }
    }
    ${groupMembers}
  `;
  return terrasoApi
    .request(query, { slug, accountEmail: currentUser.email })
    .then(_.get('groups.edges[0].node'))
    .then(group => group || Promise.reject('not_found'))
    .then(group => ({
      members: extractMembers(group),
    }));
};

export const removeMember = (member, currentUser) => {
  const query = `
    mutation deleteMembership($input: MembershipDeleteMutationInput!) {
      deleteMembership(input: $input) {
        membership {
          group {
            ...groupMembers
          }
        }
      }
    }
    ${groupMembers}
  `;
  return terrasoApi
    .request(query, {
      input: { id: member.membershipId },
      accountEmail: currentUser.email,
    })
    .then(_.get('deleteMembership.membership.group'))
    .then(group => ({
      members: extractMembers(group),
    }));
};

export const updateMemberRole = ({ member, newRole }, currentUser) => {
  const query = `
    mutation updateMembership($input: MembershipUpdateMutationInput!) {
      updateMembership(input: $input) {
        membership {
          group {
            ...groupMembers
          }
        }
      }
    }
    ${groupMembers}
  `;
  return terrasoApi
    .request(query, {
      input: { id: member.membershipId, userRole: newRole },
      accountEmail: currentUser.email,
    })
    .then(_.get('updateMembership.membership.group'))
    .then(group => ({
      members: extractMembers(group),
    }));
};

const updateGroup = group => {
  const query = `
    mutation updateGroup($input: GroupUpdateMutationInput!) {
      updateGroup(input: $input) {
        group { ...groupFields }
      }
    }
    ${groupFields}
  `;
  return terrasoApi
    .request(query, { input: cleanGroup(group) })
    .then(response => ({ new: false, ...response.updateGroup.group }));
};

const addGroup = ({ group, user }) => {
  const query = `
    mutation addGroup($input: GroupAddMutationInput!){
      addGroup(input: $input) {
        group { ...groupFields }
      }
    }
    ${groupFields}
  `;

  return terrasoApi
    .request(query, { input: cleanGroup(group) })
    .then(response => ({ new: true, ...response.addGroup.group }));
};

export const saveGroup = ({ group, user }) =>
  group.id ? updateGroup(group) : addGroup({ group, user });

export const joinGroup = (
  { groupSlug, userEmail, userRole = 'member' },
  currentUser
) => {
  const query = `
    mutation addMembership($input: MembershipAddMutationInput!, $accountEmail: String!){
      addMembership(input: $input) {
        membership {
          group {
            ...groupFields
            ...groupMembersInfo
            ...accountMembership
          }
        }
      }
    }
    ${groupFields}
    ${groupMembersInfo}
    ${accountMembership}
  `;
  return terrasoApi
    .request(query, {
      input: {
        userEmail,
        groupSlug,
        userRole,
      },
      accountEmail: currentUser.email,
    })
    .then()
    .then(_.get('addMembership.membership.group'))
    .then(group => group || Promise.reject('not_found'))
    .then(group => ({
      ..._.omit(['memberships', 'accountMembership'], group),
      membersInfo: extractMembersInfo(group),
    }));
};

export const leaveGroup = ({ groupSlug, membershipId }, currentUser) => {
  const query = `
    mutation deleteMembership($input: MembershipDeleteMutationInput!, $accountEmail: String!){
      deleteMembership(input: $input) {
        membership {
          group {
            ...groupFields
            ...groupMembersInfo
            ...accountMembership
          }
        }
      }
    }
    ${groupFields}
    ${groupMembersInfo}
    ${accountMembership}
  `;
  return terrasoApi
    .request(query, {
      input: { id: membershipId },
      accountEmail: currentUser.email,
    })
    .then()
    .then(_.get('deleteMembership.membership.group'))
    .then(group => ({
      ..._.omit(['memberships', 'accountMembership'], group),
      membersInfo: extractMembersInfo(group),
    }));
};
