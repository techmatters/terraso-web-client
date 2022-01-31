import _ from 'lodash/fp';

import * as terrasoApi from 'terrasoBackend/api';
import { groupFields } from 'group/groupFragments';
import { landscapeFields } from 'landscape/landscapeFragments';

export const fetchHomeData = email => {
  const query = `
    query home($email: String!) {
      landscapeGroups: groups(
        memberships_Email: $email,
        associatedLandscapes_IsDefaultLandscapeGroup: true
      ) {
        edges {
          node {
            associatedLandscapes {
              edges {
                node {
                  landscape {
                    ...landscapeFields
                  }
                }
              }
            }
          }
        }
      }
      landscapesDiscovery: landscapes {
        edges {
          node {
            ...landscapeFields
          }
        }
      }
      userIndependentGroups: groups(
        memberships_Email: $email,
        associatedLandscapes_Isnull: true
      ) {
        edges {
          node {
            ...groupFields
          }
        }
      }
      userLandscapeGroups: groups(
        memberships_Email: $email,
        associatedLandscapes_IsDefaultLandscapeGroup: false
      ) {
        edges {
          node {
            ...groupFields
          }
        }
      }
    }
    ${groupFields}
    ${landscapeFields}
  `;
  return terrasoApi.request(query, { email }).then(response => ({
    groups: [
      ..._.getOr([], 'userIndependentGroups.edges', response),
      ..._.getOr([], 'userLandscapeGroups.edges', response),
    ]
      .map(_.get('node'))
      .filter(group => group),
    landscapes: _.getOr([], 'landscapeGroups.edges', response)
      .flatMap(_.getOr([], 'node.associatedLandscapes.edges'))
      .map(_.get('node.landscape'))
      .filter(landscape => landscape),
    landscapesDiscovery: _.getOr([], 'landscapesDiscovery.edges', response).map(
      edge => edge.node
    ),
  }));
};
