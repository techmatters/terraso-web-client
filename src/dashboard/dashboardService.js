import _ from 'lodash'

import * as terrasoApi from 'terrasoBackend/api'
import { groupFields } from 'group/groupFragments'

export const fetchDashboardData = email => {
  const query = `
    query dashboard($email: String!) {
      userGroups: users(email: $email) {
        edges {
          node {
            memberships {
              edges {
                node {
                  group {
                    ...groupFields
                  }
                }
              }
            }
          }
        }
      }
    }
    ${groupFields}
  `
  return terrasoApi
    .request(query, { email })
    .then(response => ({
      groups: _.get(response, 'userGroups.edges[0].node.memberships.edges', [])
        .map(edge => _.get(edge, 'node.group'))
        .filter(group => group),
      landscapes: []
    }))
}
