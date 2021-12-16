import _ from 'lodash'

import * as terrasoApi from 'terrasoBackend/api'
import { groupFields } from 'group/groupFragments'
import { landscapeFields } from 'landscape/landscapeFragments'

export const fetchDashboardData = email => {
  const query = `
    query dashboard($email: String!) {
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
      groups: groups(
        members_Email: $email,
        associatedLandscapes_Isnull:true
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
  `
  return terrasoApi
    .request(query, { email })
    .then(response => ({
      groups: _.get(response, 'groups.edges', [])
        .map(groupEdge => _.get(groupEdge, 'node'))
        .filter(group => group),
      landscapes: _.get(response, 'landscapeGroups.edges', [])
        .flatMap(groupEdge => _.get(groupEdge, 'node.associatedLandscapes.edges', []))
        .map(landscapeEdge => _.get(landscapeEdge, 'node.landscape'))
        .filter(landscape => landscape)
    }))
}
