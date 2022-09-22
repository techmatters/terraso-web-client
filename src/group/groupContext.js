import React, { useContext, useMemo } from 'react';

import _ from 'lodash/fp';
import { useTranslation } from 'react-i18next';

const GroupContext = React.createContext();

export const GroupContextProvider = props => {
  const { t } = useTranslation();

  const entityType = useMemo(
    () =>
      props?.owner?.defaultGroup
        ? t('sharedData.entity_type_landscape')
        : t('sharedData.entity_type_group'),
    [props?.owner?.defaultGroup, t]
  );

  const providerValue = {
    entityType,
    ..._.pick(
      [
        'owner',
        'baseOwnerUrl',
        'group',
        'groupSlug',
        'members',
        'onMemberRemove',
        'onMemberRoleChange',
        'MemberLeaveButton',
        'MemberRemoveButton',
        'MemberJoinButton',
        'MemberRequestJoinButton',
        'MemberRequestCancelButton',
        'updateOwner',
      ],
      props
    ),
  };

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
