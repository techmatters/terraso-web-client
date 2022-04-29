import React from 'react';

import _ from 'lodash/fp';
import { useTranslation } from 'react-i18next';

import ConfirmButton from 'common/components/ConfirmButton';

const LandscapeMemberLeave = props => {
  const { t } = useTranslation();
  const { renderLabel, owner, onConfirm, buttonProps, loading } = props;

  const role = owner?.defaultGroup?.membersInfo?.accountMembership?.userRole;

  return (
    <ConfirmButton
      onConfirm={onConfirm}
      confirmTitle={t('landscape.membership_leave_confirm_title', {
        name: _.get('name', owner),
      })}
      confirmMessage={t('landscape.membership_leave_confirm_message', {
        name: _.get('name', owner),
      })}
      confirmButton={t('landscape.membership_leave_confirm_button')}
      buttonLabel={t(renderLabel(role))}
      buttonProps={buttonProps}
      loading={loading}
    />
  );
};

export default LandscapeMemberLeave;
