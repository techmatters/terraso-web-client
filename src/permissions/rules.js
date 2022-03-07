import _ from 'lodash/fp';

const isAllowedToChangeGroup = ({ resource: group }) => {
  const isManager = _.get('accountMembership.userRole', group) === 'MANAGER';
  return Promise.resolve(isManager);
};

const isAllowedToManagerGroupMembers = ({ resource: group }) => {
  const isManager = _.get('accountMembership.userRole', group) === 'MANAGER';
  return Promise.resolve(isManager);
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
  'landscape.change': isAllowedToChangeLandscape,
};

export default rules;
