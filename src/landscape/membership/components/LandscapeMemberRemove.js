import React from 'react';

import _ from 'lodash/fp';
import { useTranslation } from 'react-i18next';

import ConfirmButton from 'common/components/ConfirmButton';

const LandscapeMemberRemove = props => {
  const { t } = useTranslation();
  const { owner, member, onConfirm, loading } = props;
  return (
    <ConfirmButton
      onConfirm={onConfirm}
      confirmTitle={t('landscape.members_remove_confirmation_title')}
      confirmMessage={t('landscape.members_remove_confirmation_message', {
        userName: t('user.full_name', { user: member }),
        name: _.get('name', owner),
      })}
      confirmButton={t('landscape.members_remove_confirmation_button')}
      buttonLabel={t('landscape.members_list_remove')}
      loading={loading}
    />
  );
};

export default LandscapeMemberRemove;
