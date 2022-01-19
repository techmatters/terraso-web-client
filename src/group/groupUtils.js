import _ from 'lodash'

export const extractMembers = group => _.get(group, 'memberships.edges', [])
  .map(edge => ({
    membershipId: _.get(edge, 'node.id'),
    ..._.get(edge, 'node.user')
  }))

export const extractAccountMembership = group => _.get(group, 'accountMembership.edges[0].node')

export const getMemberships = groups => _.chain(groups)
  .map(group => ([group.slug, { group, fetching: false }]))
  .fromPairs()
  .value()
