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
  extractAccountMembership,
  extractMembersInfo,
} from 'terraso-client-shared/memberships/membershipsUtils';
import * as terrasoApi from 'terraso-client-shared/terrasoApi/api';
import { graphql } from 'terrasoApi/shared/graphqlSchema';

import { extractDataEntries } from 'sharedData/sharedDataUtils';

import type { Group } from './groupSlice';

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
    .then(
      resp => resp.groups?.edges.at(0)?.node || Promise.reject('not_found')
    );
};

export const fetchGroupToView = async (slug: string) => {
  const query = graphql(`
    query groupToView($slug: String!) {
      groups(slug: $slug) {
        edges {
          node {
            ...groupFields
            ...groupMembersInfo
            ...groupMembersPending
            ...accountMembership
            ...groupDataEntries
          }
        }
      }
    }
  `);
  return terrasoApi
    .requestGraphQL(query, {
      slug,
    })
    .then(resp => resp.groups?.edges.at(0)?.node || Promise.reject('not_found'))
    .then(group => ({
      ..._.omit(['memberships', 'membershipsCount'], group),
      membersInfo: extractMembersInfo(group),
      accountMembership: extractAccountMembership(group),
      dataEntries: extractDataEntries(group),
    }));
};

export const fetchGroups = () => {
  const query = graphql(`
    query groups {
      independentGroups: groups(associatedLandscapes_Isnull: true) {
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
          ..._.omit(
            ['memberships', 'accountMembership', 'membershipsCount'],
            edge.node
          ),
          membersInfo: extractMembersInfo(edge.node),
        }))
      )
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
      ...group,
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
    .requestGraphQL(query, { input: _.omit('slug', group) })
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

  return terrasoApi.requestGraphQL(query, { input: group }).then(response => ({
    new: true,
    ...response.addGroup.group!,
  }));
};

export const saveGroup = ({ group }: { group: Group }) =>
  group.id ? updateGroup(group) : addGroup(group);
