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

const isAllowedToEditSharedData = ({ resource: { group, file }, user }) => {
  const isManager = hasRole({ group, user, role: 'MANAGER' });
  const isOwner = _.get('createdBy.id', file) === _.get('id', user);
  return Promise.resolve(isManager || isOwner);
};

const isAllowedToDeleteSharedData = ({ resource, user }) => {
  return isAllowedToEditSharedData({ resource, user });
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
};

export default rules;
