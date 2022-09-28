import _ from 'lodash/fp';

export const extractMembersInfo = group => ({
  totalCount: _.get('memberships.totalCount', group),
  pendingCount: _.get('pending.totalCount', group),
  accountMembership: extractAccountMembership(group),
  membersSample: extractMembers(group),
});

export const extractMembers = group =>
  _.getOr([], 'memberships.edges', group).map(edge => ({
    membershipId: _.get('node.id', edge),
    role: _.get('node.userRole', edge),
    membershipStatus: _.get('node.membershipStatus', edge),
    ..._.get('node.user', edge),
  }));

export const extractAccountMembership = group =>
  _.get('accountMembership.edges[0].node', group);

export const getMemberships = groups =>
  _.flow(
    _.map(group => [group.slug, { group, fetching: false }]),
    _.fromPairs
  )(groups);

export const generateIndexedMembers = _.keyBy(member => member.membershipId);

export const extractDataEntries = group =>
  _.getOr([], 'dataEntries.edges', group)
    .map(_.get('node'))
    .map(dataEntry => ({
      ...dataEntry,
      visualizations: _.getOr([], 'visualizations.edges', dataEntry).map(
        _.get('node')
      ),
    }));
