import React, { useContext } from 'react';

import _ from 'lodash/fp';

const GroupContext = React.createContext();

export const GroupContextProvider = props => {
  const providerValue = _.pick(
    [
      'owner',
      'group',
      'groupSlug',
      'members',
      'onMemberRemove',
      'onMemberRoleChange',
      'MemberLeaveButton',
      'MemberRemoveButton',
      'MemberJoinButton',
      'updateOwner',
    ],
    props
  );

  return (
    <GroupContext.Provider value={providerValue}>
      {props.children}
    </GroupContext.Provider>
  );
};

export const useGroupContext = () => {
  const context = useContext(GroupContext);
  return context;
};
