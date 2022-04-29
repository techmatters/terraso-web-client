import React from 'react';

import _ from 'lodash/fp';
import { useTranslation } from 'react-i18next';

import ConfirmButton from 'common/components/ConfirmButton';

const GroupMemberRemove = props => {
  const { t } = useTranslation();
  const { owner, member, onConfirm, loading } = props;
  return (
    <ConfirmButton
      onConfirm={onConfirm}
      confirmTitle={t('group.members_remove_confirmation_title')}
      confirmMessage={t('group.members_remove_confirmation_message', {
        userName: t('user.full_name', { user: member }),
        name: _.get('name', owner),
      })}
      confirmButton={t('group.members_remove_confirmation_button')}
      buttonLabel={t('group.members_list_remove')}
      loading={loading}
    />
  );
};

export default GroupMemberRemove;
