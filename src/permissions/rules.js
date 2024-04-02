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

import {
  MEMBERSHIP_OPEN,
  MEMBERSHIP_STATUS_APPROVED,
  ROLE_MANAGER,
} from 'group/membership/components/groupMembershipConstants';
import { MEMBERSHIP_ROLE_MANAGER } from 'landscape/landscapeConstants';
import { MEMBERSHIP_ROLE_EDITOR } from 'storyMap/storyMapConstants';

const getAccountMembership = owner =>
  _.getOr(
    _.get('membershipInfo.accountMembership', owner),
    'accountMembership',
    owner
  );

const isApprovedMember = owner => {
  const accountMembership = getAccountMembership(owner);
  if (!accountMembership || !accountMembership.userRole) {
    return false;
  }

  const isApproved =
    accountMembership.membershipStatus === MEMBERSHIP_STATUS_APPROVED;

  return isApproved;
};

const hasRole = ({ owner, role }) => {
  const isMember = isApprovedMember(owner);
  if (!isMember) {
    return false;
  }
  const accountMembership = getAccountMembership(owner);
  const hasRole = accountMembership.userRole === role;
  return hasRole;
};

const isAllowedToEditSharedData = ({
  resource: { owner, dataEntry },
  user,
}) => {
  const isManager = hasRole({ owner, role: ROLE_MANAGER });
  const isOwner = _.get('createdBy.id', dataEntry) === _.get('id', user);
  return Promise.resolve(isManager || isOwner);
};

const isAllowedToDeleteSharedData = ({ resource, user }) => {
  return isAllowedToEditSharedData({ resource, user });
};

const isAllowedToDeleteVisualization = ({
  resource: { owner, visualizationConfig },
  user,
}) => {
  const isManager = hasRole({ owner, role: ROLE_MANAGER });
  const isOwner =
    _.get('createdBy.id', visualizationConfig) === _.get('id', user);
  return Promise.resolve(isManager || isOwner);
};

const isAllowedToDownloadSharedData = ({ resource: owner }) => {
  const isMember = isApprovedMember(owner);
  return Promise.resolve(isMember);
};

const isAllowedToAddSharedData = ({ resource: owner }) => {
  const isMember = isApprovedMember(owner);
  return Promise.resolve(isMember);
};

const isAllowedToChangeGroup = ({ resource: owner }) => {
  const isManager = hasRole({ owner, role: ROLE_MANAGER });
  return Promise.resolve(isManager);
};

// is open group or closed + you are a member
const isAllowedToViewGroupMembers = ({ resource: group }) => {
  const isOpenGroup = group.membershipInfo.membershipType === MEMBERSHIP_OPEN;
  if (isOpenGroup) {
    return Promise.resolve(true);
  }

  const isMember = isApprovedMember(group);
  return Promise.resolve(isMember);
};

const isAllowedToManageGroupMembers = ({ resource: owner }) => {
  const isManager = hasRole({ owner, role: ROLE_MANAGER });
  return Promise.resolve(isManager);
};

const isAllowedToManageLandscapeMembers = ({ resource: owner }) => {
  const isManager = hasRole({ owner, role: MEMBERSHIP_ROLE_MANAGER });
  return Promise.resolve(isManager);
};

const isAllowedToViewSharedDataFiles = ({ resource: owner }) => {
  const isMember = isApprovedMember(owner);
  return Promise.resolve(isMember);
};

const isAllowedToChangeLandscape = ({ resource: landscape }) => {
  const isManager = hasRole({
    owner: landscape,
    role: ROLE_MANAGER,
  });
  return Promise.resolve(isManager);
};

const isAllowedToChangeStoryMap = ({ resource: storyMap, user }) => {
  const isOwner = _.get('createdBy.id', storyMap) === _.get('id', user);
  if (isOwner) {
    return Promise.resolve(isOwner);
  }
  const accountMembership = storyMap.accountMembership;
  return Promise.resolve(
    accountMembership &&
      accountMembership.userRole === MEMBERSHIP_ROLE_EDITOR &&
      accountMembership.membershipStatus === MEMBERSHIP_STATUS_APPROVED
  );
};

const isAllowedToDeleteStoryMap = ({ resource: storyMap, user }) => {
  const isOwner = storyMap?.createdBy?.id && storyMap.createdBy.id === user?.id;
  return Promise.resolve(isOwner);
};

const isAllowedToDeleteStoryMapMembership = ({ resource, user }) => {
  const { storyMap, membership } = resource;
  const isOwner = storyMap?.createdBy?.id && storyMap.createdBy.id === user?.id;
  if (isOwner) {
    return Promise.resolve(isOwner);
  }
  return Promise.resolve(membership?.userId && membership.userId === user?.id);
};

const rules = {
  'group.change': isAllowedToChangeGroup,
  'group.manageMembers': isAllowedToManageGroupMembers,
  'group.viewMembers': isAllowedToViewGroupMembers,
  'landscape.change': isAllowedToChangeLandscape,
  'landscape.manageMembers': isAllowedToManageLandscapeMembers,
  'sharedData.add': isAllowedToAddSharedData,
  'sharedData.download': isAllowedToDownloadSharedData,
  'sharedData.edit': isAllowedToEditSharedData,
  'sharedData.delete': isAllowedToDeleteSharedData,
  'sharedData.viewFiles': isAllowedToViewSharedDataFiles,
  'visualization.delete': isAllowedToDeleteVisualization,
  'storyMap.change': isAllowedToChangeStoryMap,
  'storyMap.delete': isAllowedToDeleteStoryMap,
  'storyMap.deleteMembership': isAllowedToDeleteStoryMapMembership,
};

export default rules;
