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

export const extractDataEntry = dataEntry => ({
  ...dataEntry,
  visualizations: _.getOr([], 'visualizations.edges', dataEntry).map(
    _.get('node')
  ),
});

export const extractGroupDataEntries = group =>
  _.getOr([], 'dataEntries.edges', group)
    .map(_.get('node'))
    .map(extractDataEntry);
