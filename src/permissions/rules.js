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

import { MEMBERSHIP_STATUS_APPROVED } from 'group/membership/components/groupMembershipConstants';

const getAccountMembership = group =>
  _.getOr(
    _.get('membersInfo.accountMembership', group),
    'accountMembership',
    group
  );

const isApprovedMember = group => {
  const accountMembership = getAccountMembership(group);
  if (!accountMembership || !accountMembership.userRole) {
    return false;
  }

  const isApproved =
    accountMembership.membershipStatus === MEMBERSHIP_STATUS_APPROVED;

  return isApproved;
};

const hasRole = ({ group, role }) => {
  const isMember = isApprovedMember(group);
  if (!isMember) {
    return false;
  }
  const accountMembership = getAccountMembership(group);
  const hasRole = accountMembership.userRole === role;
  return hasRole;
};

const isAllowedToEditSharedData = ({
  resource: { group, dataEntry },
  user,
}) => {
  const isManager = hasRole({ group, role: 'MANAGER' });
  const isOwner = _.get('createdBy.id', dataEntry) === _.get('id', user);
  return Promise.resolve(isManager || isOwner);
};

const isAllowedToDeleteSharedData = ({ resource, user }) => {
  return isAllowedToEditSharedData({ resource, user });
};

const isAllowedToDeleteVisualization = ({
  resource: { group, visualizationConfig },
  user,
}) => {
  const isManager = hasRole({ group, role: 'MANAGER' });
  const isOwner =
    _.get('createdBy.id', visualizationConfig) === _.get('id', user);
  return Promise.resolve(isManager || isOwner);
};

const isAllowedToDownloadSharedData = ({ resource: group }) => {
  const isMember = isApprovedMember(group);
  return Promise.resolve(isMember);
};

const isAllowedToAddSharedData = ({ resource: group }) => {
  const isMember = isApprovedMember(group);
  return Promise.resolve(isMember);
};

const isAllowedToChangeGroup = ({ resource: group }) => {
  const isManager = hasRole({ group, role: 'MANAGER' });
  return Promise.resolve(isManager);
};

const isAllowedToManagerGroupMembers = ({ resource: group }) => {
  const isManager = hasRole({ group, role: 'MANAGER' });
  return Promise.resolve(isManager);
};

const isAllowedToViewGroupSharedData = ({ resource: group }) => {
  const isMember = isApprovedMember(group);
  return Promise.resolve(isMember);
};

const isAllowedToChangeLandscape = ({ resource: landscape }) => {
  const isManager = hasRole({ group: landscape.defaultGroup, role: 'MANAGER' });
  return Promise.resolve(isManager);
};

const rules = {
  'group.change': isAllowedToChangeGroup,
  'group.manageMembers': isAllowedToManagerGroupMembers,
  'group.viewFiles': isAllowedToViewGroupSharedData,
  'landscape.change': isAllowedToChangeLandscape,
  'sharedData.add': isAllowedToAddSharedData,
  'sharedData.download': isAllowedToDownloadSharedData,
  'sharedData.edit': isAllowedToEditSharedData,
  'sharedData.delete': isAllowedToDeleteSharedData,
  'visualization.delete': isAllowedToDeleteVisualization,
};

export default rules;
