import _ from 'lodash'

export const extractMembers = group => _.get(group, 'memberships.edges', [])
  .map(edge => ({
    membershipId: _.get(edge, 'node.id'),
    ..._.get(edge, 'node.user')
  }))
