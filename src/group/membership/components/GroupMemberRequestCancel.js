import React from 'react';

import _ from 'lodash/fp';
import { useTranslation } from 'react-i18next';

import ConfirmButton from 'common/components/ConfirmButton';

const GroupMemberRequestCancel = props => {
  const { t } = useTranslation();
  const { label, owner, onConfirm, buttonProps, loading } = props;

  return (
    <ConfirmButton
      onConfirm={onConfirm}
      confirmTitle={t('group.membership_request_cancel_confirm_title', {
        name: _.get('name', owner),
      })}
      confirmMessage={t('group.membership_request_cancel_confirm_message', {
        name: _.get('name', owner),
      })}
      confirmButton={t('group.membership_request_cancel_confirm_button')}
      buttonLabel={t(label)}
      ariaLabel={t('group.list_request_cancel_label', {
        name: _.get('name', owner),
      })}
      buttonProps={buttonProps}
      loading={loading}
    />
  );
};

export default GroupMemberRequestCancel;
