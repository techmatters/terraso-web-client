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
import type { User } from 'terraso-client-shared/account/accountSlice';
import { extractMembership } from 'terraso-client-shared/collaboration/membershipsUtils';
import {
  CollaborationMembershipFieldsFragment,
  GroupMembershipDeleteMutationInput,
  GroupMembershipSaveMutationInput,
} from 'terraso-client-shared/graphqlSchema/graphql';
import * as terrasoApi from 'terraso-client-shared/terrasoApi/api';
import { normalizeText } from 'terraso-client-shared/utils';
import { graphql } from 'terrasoApi/shared/graphqlSchema';

import type { Group } from 'group/groupSlice';
import { extractGroup } from 'group/groupUtils';
import { ROLE_MEMBER } from 'group/membership/components/groupMembershipConstants';

export const fetchGroupToUpdate = (slug: string) => {
  const query = graphql(`
    query groupToUpdate($slug: String!) {
      groups(slug: $slug) {
        edges {
          node {
            ...groupFields
            ...groupMembershipList
          }
        }
      }
    }
  `);
  return terrasoApi
    .requestGraphQL(query, { slug })
    .then(resp => resp.groups?.edges.at(0)?.node || Promise.reject('not_found'))
    .then(extractGroup);
};

export const fetchGroupToView = async (slug: string, user: User | null) => {
  const query = graphql(`
    query groupToView($slug: String!, $accountEmail: String!) {
      groups(slug: $slug) {
        edges {
          node {
            ...groupFields
            ...groupDataEntries
            ...groupMembershipListWithMembersSample
          }
        }
      }
    }
  `);
  return terrasoApi
    .requestGraphQL(query, {
      slug,
      accountEmail: user?.email ?? '',
    })
    .then(resp => resp.groups?.edges.at(0)?.node || Promise.reject('not_found'))
    .then(extractGroup);
};

export const fetchGroups = () => {
  const query = graphql(`
    query groups {
      independentGroups: groups(associatedLandscapes_Isnull: true) {
        edges {
          node {
            ...groupFields
            ...groupMembershipList
          }
        }
      }
      landscapeGroups: groups(associatedLandscapes_Isnull: false) {
        edges {
          node {
            ...groupFields
            ...groupMembershipList
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
      .then(groups => groups.map(edge => extractGroup(edge.node)))
      // eslint-disable-next-line lodash-fp/no-extraneous-function-wrapping
      .then(groups => {
        return _.orderBy([group => group.name.toLowerCase()], [], groups);
      })
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
      landscapeGroups: groups(associatedLandscapes_Isnull: false) {
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
        _.orderBy([group => normalizeText(group.name)], [], groups)
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
            membershipList {
              ...collaborationMemberships
              ...accountCollaborationMembership
            }
          }
        }
      }
    }
  `);
  return terrasoApi
    .requestGraphQL(query, { slug })
    .then(resp => resp.groups?.edges.at(0)?.node || Promise.reject('not_found'))
    .then(extractGroup);
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
            ...groupMembershipList
          }
        }
      }
    }
  `);
  return terrasoApi
    .requestGraphQL(query, { slug })
    .then(resp => resp.groups?.edges.at(0)?.node || Promise.reject('not_found'))
    .then(extractGroup);
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
    .requestGraphQL(query, {
      input: {
        ..._.omit(
          ['slug', 'membershipInfo', 'membershipList', 'dataEntries'],
          group
        ),
        id: group.id || '',
      },
    })
    .then(response => ({
      new: false,
      ...response.updateGroup.group!,
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
    .requestGraphQL(query, {
      input: {
        ..._.omit(['slug', 'membershipInfo', 'membershipList'], group),
        name: group.name ?? '',
      },
    })
    .then(response => ({
      new: true,
      ...response.addGroup.group!,
    }));
};

export const saveGroup = ({ group }: { group: Group }) =>
  group.id ? updateGroup(group) : addGroup(group);

export const leaveGroup = (
  input: GroupMembershipDeleteMutationInput,
  user: User | null
) => {
  const query = graphql(`
    mutation deleteGroupMembership(
      $input: GroupMembershipDeleteMutationInput!
      $accountEmail: String!
    ) {
      deleteGroupMembership(input: $input) {
        group {
          ...groupFields
          ...groupDataEntries
          ...groupMembershipListWithMembersSample
        }
        errors
      }
    }
  `);
  return terrasoApi
    .requestGraphQL(query, {
      input,
      accountEmail: user!.email,
    })
    .then(resp => resp.deleteGroupMembership.group)
    .then(extractGroup);
};

export const joinGroup = (
  { groupSlug }: { groupSlug: string },
  user: User | null
) => {
  const query = graphql(`
    mutation joinGroup(
      $input: GroupMembershipSaveMutationInput!
      $accountEmail: String!
    ) {
      saveGroupMembership(input: $input) {
        group {
          ...groupFields
          ...groupDataEntries
          ...groupMembershipListWithMembersSample
        }
        errors
      }
    }
  `);
  return terrasoApi
    .requestGraphQL(query, {
      input: {
        groupSlug,
        userEmails: [user!.email],
        userRole: ROLE_MEMBER,
      },
      accountEmail: user!.email,
    })
    .then(resp => resp.saveGroupMembership.group)
    .then(extractGroup);
};

export const leaveGroupFromList = (
  input: GroupMembershipDeleteMutationInput
) => {
  const query = graphql(`
    mutation leaveGroupFromList($input: GroupMembershipDeleteMutationInput!) {
      deleteGroupMembership(input: $input) {
        group {
          ...groupFields
          ...groupMembershipList
        }
        errors
      }
    }
  `);
  return terrasoApi
    .requestGraphQL(query, {
      input,
    })
    .then(resp => resp.deleteGroupMembership.group)
    .then(extractGroup);
};

export const joinGroupFromListPage = (
  { groupSlug }: { groupSlug: string },
  user: User | null
) => {
  const query = graphql(`
    mutation joinGroupFromListPage($input: GroupMembershipSaveMutationInput!) {
      saveGroupMembership(input: $input) {
        group {
          ...groupFields
          ...groupMembershipList
        }
        errors
      }
    }
  `);
  return terrasoApi
    .requestGraphQL(query, {
      input: {
        groupSlug,
        userEmails: [user!.email],
        userRole: ROLE_MEMBER,
      },
    })
    .then(resp => resp.saveGroupMembership.group)
    .then(extractGroup);
};

export const changeMemberRole = (input: GroupMembershipSaveMutationInput) => {
  const query = graphql(`
    mutation changeGroupMemberRole($input: GroupMembershipSaveMutationInput!) {
      saveGroupMembership(input: $input) {
        memberships {
          ...collaborationMembershipFields
        }
        errors
      }
    }
  `);
  return terrasoApi
    .requestGraphQL(query, {
      input,
    })
    .then(resp => resp.saveGroupMembership.memberships?.[0])
    .then(membership => membership as CollaborationMembershipFieldsFragment)
    .then(extractMembership);
};

export const removeMember = (
  input: GroupMembershipDeleteMutationInput & {
    email: string;
  }
) => {
  const query = graphql(`
    mutation removeGroupMember($input: GroupMembershipDeleteMutationInput!) {
      deleteGroupMembership(input: $input) {
        membership {
          ...collaborationMembershipFields
        }
        errors
      }
    }
  `);
  return terrasoApi
    .requestGraphQL(query, {
      input: _.omit('email', input),
    })
    .then(
      resp =>
        resp.deleteGroupMembership
          .membership as CollaborationMembershipFieldsFragment
    )
    .then(extractMembership);
};
