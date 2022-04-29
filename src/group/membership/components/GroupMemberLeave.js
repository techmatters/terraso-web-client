import React from 'react';
import { useTranslation } from 'react-i18next';

import _ from 'lodash/fp';

import ConfirmButton from 'common/components/ConfirmButton';

const GroupMemberLeave = props => {
  const { t } = useTranslation();
  const { renderLabel, owner, onConfirm, buttonProps, loading } = props;

  const role = owner?.membersInfo?.accountMembership?.userRole;

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
      buttonLabel={t(renderLabel(role))}
      buttonProps={buttonProps}
      loading={loading}
    />
  );
};

export default GroupMemberLeave;
