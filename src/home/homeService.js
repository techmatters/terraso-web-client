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

import { groupFields, groupMembersPending } from 'group/groupFragments';
import { extractAccountMembership, extractMembersInfo } from 'group/groupUtils';
import { defaultGroup, landscapeFields } from 'landscape/landscapeFragments';
import * as terrasoApi from 'terrasoBackend/api';

export const fetchHomeData = email => {
  const query = `
    query home($accountEmail: String!) {
      landscapeGroups: groups(
        memberships_Email: $accountEmail,
        associatedLandscapes_IsDefaultLandscapeGroup: true
      ) {
        edges {
          node {
            associatedLandscapes {
              edges {
                node {
                  landscape {
                    ...landscapeFields
                    ...defaultGroup
                  }
                }
              }
            }
          }
        }
      }
      userIndependentGroups: groups(
        memberships_Email: $accountEmail,
        associatedLandscapes_Isnull: true
      ) {
        edges {
          node {
            ...groupFields
            ...groupMembersPending
            ...accountMembership
          }
        }
      }
      userLandscapeGroups: groups(
        memberships_Email: $accountEmail,
        associatedLandscapes_IsDefaultLandscapeGroup: false
      ) {
        edges {
          node {
            ...groupFields
            ...groupMembersPending
            ...accountMembership
          }
        }
      }
    }
    ${groupFields}
    ${groupMembersPending}
    ${landscapeFields}
    ${defaultGroup}
  `;
  return terrasoApi
    .requestGraphQL(query, { accountEmail: email })
    .then(response => ({
      groups: [
        ..._.getOr([], 'userIndependentGroups.edges', response),
        ..._.getOr([], 'userLandscapeGroups.edges', response),
      ]
        .map(_.get('node'))
        .filter(group => group)
        .map(group => ({
          ..._.omit(['accountMembership'], group),
          membersInfo: extractMembersInfo(group),
        })),
      landscapes: _.getOr([], 'landscapeGroups.edges', response)
        .flatMap(_.getOr([], 'node.associatedLandscapes.edges'))
        .map(_.get('node.landscape'))
        .filter(landscape => landscape)
        .map(landscape => ({
          ..._.omit(['associatedGroups'], landscape),
          accountMembership: extractAccountMembership(
            _.get('defaultGroup.edges[0].node.group', landscape)
          ),
        })),
    }));
};
