/*
 * Copyright © 2021-2023 Technology Matters
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see https://www.gnu.org/licenses/.
 */

import React from 'react';
import _ from 'lodash/fp';
import { useTranslation } from 'react-i18next';

import ConfirmButton from 'common/components/ConfirmButton';

const GroupMemberLeave = props => {
  const { t } = useTranslation();
  const { label, owner, onConfirm, buttonProps, loading } = props;

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
      buttonLabel={t(label)}
      ariaLabel={t('group.list_leave_label', {
        name: _.get('name', owner),
      })}
      buttonProps={buttonProps}
      loading={loading}
    />
  );
};

export default GroupMemberLeave;
