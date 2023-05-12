/*
 * Copyright © 2021-2023 Technology Matters
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see https://www.gnu.org/licenses/.
 */
import _ from 'lodash/fp';
import { cleanSensitiveCharacters } from 'stringUtils';
import {
  accountMembership,
  groupFields,
  groupMembers,
  groupMembersInfo,
  groupMembersPending,
  groupsListFields,
} from 'terrasoApi/group/groupFragments';
import * as terrasoApi from 'terrasoApi/terrasoBackend/api';

import {
  extractAccountMembership,
  extractMembers,
  extractMembersInfo,
} from './groupUtils';

// Omitted email because it is not supported by the backend
const cleanGroup = group => _.omit(['slug', 'membershipsCount'], group);

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
    .requestGraphQL(query, { slug })
    .then(_.get('groups.edges[0].node'))
    .then(group => group || Promise.reject('not_found'));
};

export const fetchGroupToView = slug => {
  const query = `
    query group($slug: String!){
      groups(slug: $slug) {
        edges {
          node {
            ...groupFields
            ...groupMembersInfo
            ...groupMembersPending
            ...accountMembership
          }
        }
      }
    }
    ${groupFields}
    ${groupMembersInfo}
    ${groupMembersPending}
    ${accountMembership}
  `;
  return terrasoApi
    .requestGraphQL(query, { slug })
    .then(_.get('groups.edges[0].node'))
    .then(group => group || Promise.reject('not_found'))
    .then(group => ({
      ..._.omit(['memberships', 'accountMembership'], group),
      membersInfo: extractMembersInfo(group),
      accountMembership: extractAccountMembership(group),
    }));
};

export const fetchGroupToUploadSharedData = slug => {
  const query = `
    query group($slug: String!){
      groups(slug: $slug) {
        edges {
          node {
            id
            slug
            name
            ...accountMembership
          }
        }
      }
    }
    ${accountMembership}
  `;
  return terrasoApi
    .requestGraphQL(query, { slug })
    .then(_.get('groups.edges[0].node'))
    .then(group => group || Promise.reject('not_found'))
    .then(group => ({
      ..._.omit(['memberships', 'accountMembership'], group),
      membersInfo: extractMembersInfo(group),
    }));
};

export const fetchGroups = () => {
  const query = `
    query groups {
      independentGroups: groups(
        associatedLandscapes_Isnull: true
      ) {
        edges {
          node {
            ...groupFields
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
            ...accountMembership
          }
        }
      }
    }
    ${groupFields}
    ${accountMembership}
  `;
  return terrasoApi
    .requestGraphQL(query)
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

export const fetchGroupsAutocompleteList = () => {
  const query = `
    query groups {
      independentGroups: groups(
        associatedLandscapes_Isnull: true
      ) {
        edges {
          node {
            ...groupsListFields
          }
        }
      }
      landscapeGroups: groups(
        associatedLandscapes_IsDefaultLandscapeGroup: false
      ) {
        edges {
          node {
            ...groupsListFields
          }
        }
      }
    }
    ${groupsListFields}
  `;
  return terrasoApi
    .requestGraphQL(query)
    .then(response => [
      ..._.getOr([], 'independentGroups.edges', response),
      ..._.getOr([], 'landscapeGroups.edges', response),
    ])
    .then(groups => groups.map(_.get('node')))
    .then(_.orderBy([group => cleanSensitiveCharacters(group.name)], null));
};

export const fetchGroupForMembers = slug => {
  const query = `
    query group($slug: String!){
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
    .requestGraphQL(query, { slug })
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
    .requestGraphQL(query, { slug, accountEmail: currentUser.email })
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
        errors
      }
    }
    ${groupMembers}
  `;
  return terrasoApi
    .requestGraphQL(query, {
      input: { id: member.membershipId },
      accountEmail: currentUser.email,
    })
    .then(_.get('deleteMembership.membership.group'))
    .then(group => ({
      members: extractMembers(group),
    }));
};

export const updateMember = ({ member }, currentUser) => {
  const query = `
    mutation updateMembership($input: MembershipUpdateMutationInput!) {
      updateMembership(input: $input) {
        membership {
          group {
            ...groupMembers
          }
        }
        errors
      }
    }
    ${groupMembers}
  `;
  return terrasoApi
    .requestGraphQL(query, {
      input: member,
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
        errors
      }
    }
    ${groupFields}
  `;
  return terrasoApi
    .requestGraphQL(query, { input: cleanGroup(group) })
    .then(response => ({ new: false, ...response.updateGroup.group }));
};

const addGroup = ({ group, user }) => {
  const query = `
    mutation addGroup($input: GroupAddMutationInput!){
      addGroup(input: $input) {
        group { ...groupFields }
        errors
      }
    }
    ${groupFields}
  `;

  return terrasoApi
    .requestGraphQL(query, { input: cleanGroup(group) })
    .then(response => ({ new: true, ...response.addGroup.group }));
};

export const saveGroup = ({ group, user }) =>
  group.id ? updateGroup(group) : addGroup({ group, user });

export const joinGroup = ({ groupSlug, userEmail, userRole = 'member' }) => {
  const query = `
    mutation addMembership($input: MembershipAddMutationInput!){
      addMembership(input: $input) {
        membership {
          group {
            ...groupFields
            ...groupMembersInfo
            ...accountMembership
          }
        }
        errors
      }
    }
    ${groupFields}
    ${groupMembersInfo}
    ${accountMembership}
  `;
  return terrasoApi
    .requestGraphQL(query, {
      input: {
        userEmail,
        groupSlug,
        userRole,
      },
    })
    .then(_.get('addMembership.membership.group'))
    .then(group => group || Promise.reject('not_found'))
    .then(group => ({
      ..._.omit(['memberships', 'accountMembership'], group),
      membersInfo: extractMembersInfo(group),
    }));
};

export const leaveGroup = ({ groupSlug, membershipId }) => {
  const query = `
    mutation deleteMembership($input: MembershipDeleteMutationInput!){
      deleteMembership(input: $input) {
        membership {
          group {
            ...groupFields
            ...groupMembersInfo
            ...accountMembership
          }
        }
        errors
      }
    }
    ${groupFields}
    ${groupMembersInfo}
    ${accountMembership}
  `;
  return terrasoApi
    .requestGraphQL(query, {
      input: { id: membershipId },
    })
    .then(_.get('deleteMembership.membership.group'))
    .then(group => ({
      ..._.omit(['memberships', 'accountMembership'], group),
      membersInfo: extractMembersInfo(group),
    }));
};
