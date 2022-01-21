import _ from 'lodash';

const isAllowedToChangeGroup = ({ resource: group }) => {
  const isManager = _.get(group, 'accountMembership.userRole') === 'MANAGER';
  return Promise.resolve(isManager);
};

const rules = {
  'group.change': isAllowedToChangeGroup,
};

export default rules;
