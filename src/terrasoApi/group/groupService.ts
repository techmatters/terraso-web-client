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
import { graphql } from 'terrasoApi/gql';
import type {
  CoreMembershipUserRoleChoices,
  MembershipAddMutationInput,
} from 'terrasoApi/gql/graphql';
import * as terrasoApi from 'terrasoApi/terrasoBackend/api';

import { Group, Membership } from './groupSlice';
import {
  extractAccountMembership,
  extractMembers,
  extractMembersInfo,
} from './groupUtils';

// Omitted email because it is not supported by the backend
const cleanGroup = (group: Group) => _.omit('slug', group);

export const fetchGroupToUpdate = (slug: string) => {
  const query = graphql(`
    query groupToUpdate($slug: String!) {
      groups(slug: $slug) {
        edges {
          node {
            ...groupFields
          }
        }
      }
    }
  `);
  return terrasoApi
    .requestGraphQL(query, { slug })
    .then(resp => resp.groups?.edges.at(0)?.node || Promise.reject('not_found'))
    .then(_.omit('membershipsCount'));
};

export const fetchGroupToView = (slug: string) => {
  const query = graphql(`
    query groupToView($slug: String!) {
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
  `);
  return terrasoApi
    .requestGraphQL(query, { slug })
    .then(resp => resp.groups?.edges.at(0)?.node || Promise.reject('not_found'))
    .then(group => ({
      ..._.omit(['memberships', 'membershipsCount'], group),
      membersInfo: extractMembersInfo(group),
      accountMembership: extractAccountMembership(group),
    }));
};

export const fetchGroupToUploadSharedData = (slug: string) => {
  const query = graphql(`
    query groupToUploadSharedData($slug: String!) {
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
  `);
  return terrasoApi
    .requestGraphQL(query, { slug })
    .then(resp => resp.groups?.edges.at(0)?.node || Promise.reject('not_found'))
    .then(group => ({
      ..._.omit('accountMembership', group),
      membersInfo: extractMembersInfo(group),
    }));
};

export const fetchGroups = () => {
  const query = graphql(`
    query groups {
      independentGroups: groups(associatedLandscapes_Isnull: true) {
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
  `);
  return (
    terrasoApi
      .requestGraphQL(query)
      .then(response => [
        ...(response.independentGroups?.edges || []),
        ...(response.landscapeGroups?.edges || []),
      ])
      .then(groups =>
        groups.map(edge => ({
          ..._.omit(['accountMembership', 'membershipsCount'], edge.node),
          membersInfo: extractMembersInfo(edge.node),
        }))
      )
      // eslint-disable-next-line lodash-fp/no-extraneous-function-wrapping
      .then(groups =>
        _.orderBy([group => group.name.toLowerCase()], [], groups)
      )
  );
};

export const fetchGroupsAutocompleteList = () => {
  const query = graphql(`
    query groupsAutocomplete {
      independentGroups: groups(associatedLandscapes_Isnull: true) {
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
  `);
  return (
    terrasoApi
      .requestGraphQL(query)
      .then(response => [
        ...(response.independentGroups?.edges || []),
        ...(response.landscapeGroups?.edges || []),
      ])
      .then(groups => groups.map(group => group.node))
      // eslint-disable-next-line lodash-fp/no-extraneous-function-wrapping
      .then(groups =>
        _.orderBy([group => cleanSensitiveCharacters(group.name)], [], groups)
      )
  );
};

export const fetchGroupForMembers = (slug: string) => {
  const query = graphql(`
    query groupForMembers($slug: String!) {
      groups(slug: $slug) {
        edges {
          node {
            ...groupFields
            ...accountMembership
          }
        }
      }
    }
  `);
  return terrasoApi
    .requestGraphQL(query, { slug })
    .then(resp => resp.groups?.edges.at(0)?.node || Promise.reject('not_found'))
    .then(group => ({
      ..._.omit('membershipsCount', group),
      accountMembership: extractAccountMembership(group),
    }));
};

export const fetchMembers = (slug: string) => {
  const query = graphql(`
    query groupMembers($slug: String!) {
      groups(slug: $slug) {
        edges {
          node {
            ...groupMembers
          }
        }
      }
    }
  `);
  return terrasoApi
    .requestGraphQL(query, { slug })
    .then(resp => resp.groups?.edges.at(0)?.node || Promise.reject('not_found'))
    .then(group => ({
      members: extractMembers(group),
    }));
};

export const removeMember = (member: Membership) => {
  const query = graphql(`
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
  `);
  return terrasoApi
    .requestGraphQL(query, {
      input: { id: member.membershipId },
    })
    .then(resp => resp.deleteMembership.membership!.group)
    .then(group => ({
      members: extractMembers(group),
    }));
};

export const updateMember = ({ member }: { member: Membership }) => {
  const query = graphql(`
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
  `);
  return terrasoApi
    .requestGraphQL(query, {
      input: { ...member, id: member.membershipId },
    })
    .then(resp => resp.updateMembership.membership!.group)
    .then(group => ({
      members: extractMembers(group),
    }));
};

const updateGroup = (group: Group) => {
  const query = graphql(`
    mutation updateGroup($input: GroupUpdateMutationInput!) {
      updateGroup(input: $input) {
        group {
          ...groupFields
        }
        errors
      }
    }
  `);
  return terrasoApi
    .requestGraphQL(query, { input: cleanGroup(group) })
    .then(response => ({
      new: false,
      ..._.omit('membershipsCount', response.updateGroup.group!),
    }));
};

const addGroup = (group: Group) => {
  const query = graphql(`
    mutation addGroup($input: GroupAddMutationInput!) {
      addGroup(input: $input) {
        group {
          ...groupFields
        }
        errors
      }
    }
  `);

  return terrasoApi
    .requestGraphQL(query, { input: cleanGroup(group) })
    .then(response => ({
      new: true,
      ..._.omit('membershipsCount', response.addGroup.group!),
    }));
};

export const saveGroup = ({ group }: { group: Group }) =>
  group.id ? updateGroup(group) : addGroup(group);

export const joinGroup = ({
  groupSlug,
  userEmail,
  userRole = 'MEMBER',
}: MembershipAddMutationInput & {
  userRole: CoreMembershipUserRoleChoices;
}) => {
  const query = graphql(`
    mutation addMembership($input: MembershipAddMutationInput!) {
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
  `);
  return terrasoApi
    .requestGraphQL(query, {
      input: {
        userEmail,
        groupSlug,
        userRole,
      },
    })
    .then(resp => resp.addMembership.membership?.group)
    .then(group => group || Promise.reject('not_found'))
    .then(group => ({
      ..._.omit(
        ['memberships', 'accountMembership', 'membershipsCount'],
        group
      ),
      membersInfo: extractMembersInfo(group),
    }));
};

export const leaveGroup = ({ membershipId }: Membership) => {
  const query = graphql(`
    mutation leaveGroup($input: MembershipDeleteMutationInput!) {
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
  `);
  return terrasoApi
    .requestGraphQL(query, {
      input: { id: membershipId },
    })
    .then(resp => resp.deleteMembership.membership?.group)
    .then(group => group || Promise.reject('not_found'))
    .then(group => ({
      ..._.omit(
        ['memberships', 'accountMembership', 'membershipsCount'],
        group
      ),
      membersInfo: extractMembersInfo(group),
    }));
};
