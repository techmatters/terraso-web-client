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
