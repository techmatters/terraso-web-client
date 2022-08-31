import React from 'react';

import _ from 'lodash/fp';
import { useTranslation } from 'react-i18next';

import ConfirmButton from 'common/components/ConfirmButton';

const GroupMemberLeave = props => {
  const { t } = useTranslation();
  const { owner, onConfirm, buttonProps, loading } = props;

  return (
    <ConfirmButton
      onConfirm={onConfirm}
      confirmTitle={t('group.membership_leave_confirm_title', {
        name: _.get('name', owner),
      })}
      confirmMessage={t('group.membership_leave_confirm_message', {
        name: _.get('name', owner),
      })}
      confirmButton={t('group.membership_leave_confirm_button')}
      buttonLabel={t('group.list_leave_button')}
      ariaLabel={t('landscape.list_leave_label', {
        name: _.get('name', owner),
      })}
      buttonProps={buttonProps}
      loading={loading}
    />
  );
};

export default GroupMemberLeave;
