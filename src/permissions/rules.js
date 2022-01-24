import _ from 'lodash/fp';

const isAllowedToChangeGroup = ({ resource: group }) => {
  const isManager = _.get('accountMembership.userRole', group) === 'MANAGER';
  return Promise.resolve(isManager);
};

const isAllowedToManagerGroupMembers = ({ resource: group }) => {
  const isManager = _.get('accountMembership.userRole', group) === 'MANAGER';
  return Promise.resolve(isManager);
};

const rules = {
  'group.change': isAllowedToChangeGroup,
  'group.manageMembers': isAllowedToManagerGroupMembers,
};

export default rules;
