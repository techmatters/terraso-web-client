import _ from 'lodash/fp';

const isAllowedToDeleteSharedData = ({ resource: groupAndFile, user }) => {
  const isManager =
    _.get('membersInfo.accountMembership.userRole', groupAndFile.group) ===
    'MANAGER';
  const isOwner =
    _.get('file.createdBy.id', groupAndFile) === _.get('id', user);
  return Promise.resolve(isManager) || Promise.resolve(isOwner);
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
  'sharedData.delete': isAllowedToDeleteSharedData,
};

export default rules;
