import _ from 'lodash/fp';

const isAllowedToEditSharedData = ({ resource: { group, file }, user }) => {
  const isManager =
    _.get('membersInfo.accountMembership.userRole', group) === 'MANAGER';
  const isOwner = _.get('createdBy.id', file) === _.get('id', user);
  return Promise.resolve(isManager || isOwner);
};

const isAllowedToDeleteSharedData = ({ resource, user }) => {
  return isAllowedToEditSharedData({ resource, user });
};

const isAllowedToDownloadSharedData = ({ resource: group }) => {
  const isMember = Boolean(
    _.get('membersInfo.accountMembership.userRole', group)
  );
  return Promise.resolve(isMember);
};

const isAllowedToAddSharedData = ({ resource: group }) => {
  const isMember = Boolean(
    _.get('membersInfo.accountMembership.userRole', group)
  );
  return Promise.resolve(isMember);
};

const isAllowedToChangeGroup = ({ resource: group }) => {
  const isManager = _.get('accountMembership.userRole', group) === 'MANAGER';
  return Promise.resolve(isManager);
};

const isAllowedToManagerGroupMembers = ({ resource: group }) => {
  const isManager = _.get('accountMembership.userRole', group) === 'MANAGER';
  return Promise.resolve(isManager);
};

const isAllowedToViewGroupSharedData = ({ resource: group }) => {
  const isMember = Boolean(
    _.get('membersInfo.accountMembership.userRole', group)
  );
  return Promise.resolve(isMember);
};

const isAllowedToChangeLandscape = ({ resource: landscape }) => {
  const isManager =
    _.get('defaultGroup.membersInfo.accountMembership.userRole', landscape) ===
    'MANAGER';
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
