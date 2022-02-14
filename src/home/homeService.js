import _ from 'lodash/fp';

import * as terrasoApi from 'terrasoBackend/api';
import { groupFields } from 'group/groupFragments';
import { landscapeFields, defaultGroup } from 'landscape/landscapeFragments';
import { extractAccountMembership } from 'group/groupUtils';

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
            ...accountMembership
          }
        }
      }
    }
    ${groupFields}
    ${landscapeFields}
    ${defaultGroup}
  `;
  return terrasoApi.request(query, { accountEmail: email }).then(response => ({
    groups: [
      ..._.getOr([], 'userIndependentGroups.edges', response),
      ..._.getOr([], 'userLandscapeGroups.edges', response),
    ]
      .map(_.get('node'))
      .filter(group => group)
      .map(group => ({
        ..._.omit(['accountMembership'], group),
        accountMembership: extractAccountMembership(group),
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
