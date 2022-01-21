import _ from 'lodash';

import * as terrasoApi from 'terrasoBackend/api';
import { groupFields } from 'group/groupFragments';
import { landscapeFields } from 'landscape/landscapeFragments';

export const fetchHomeData = email => {
  const query = `
    query home($email: String!) {
      landscapeGroups: groups(
        members_Email: $email,
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
        members_Email: $email,
        associatedLandscapes_Isnull: true
      ) {
        edges {
          node {
            ...groupFields
          }
        }
      }
      userLandscapeGroups: groups(
        members_Email: $email,
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
      ..._.get(response, 'userIndependentGroups.edges', []),
      ..._.get(response, 'userLandscapeGroups.edges', []),
    ]
      .map(groupEdge => _.get(groupEdge, 'node'))
      .filter(group => group),
    landscapes: _.get(response, 'landscapeGroups.edges', [])
      .flatMap(groupEdge =>
        _.get(groupEdge, 'node.associatedLandscapes.edges', [])
      )
      .map(landscapeEdge => _.get(landscapeEdge, 'node.landscape'))
      .filter(landscape => landscape),
    landscapesDiscovery: _.get(response, 'landscapesDiscovery.edges', []).map(
      edge => edge.node
    ),
  }));
};
