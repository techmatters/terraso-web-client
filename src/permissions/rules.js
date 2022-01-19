import _ from 'lodash'

const isAllowedToChangeGroup = ({ resource: group }) => {
  return Promise.resolve(_.get(group, 'accountMembership.userRole') === 'MANAGER')
}

const rules = {
  'group.change': isAllowedToChangeGroup
}

export default rules
