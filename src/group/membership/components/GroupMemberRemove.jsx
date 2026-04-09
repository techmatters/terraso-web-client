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

import _ from 'lodash/fp';
import { useTranslation } from 'react-i18next';

import ConfirmButton from 'terraso-web-client/common/components/ConfirmButton';

const GroupMemberRemove = props => {
  const { t } = useTranslation();
  const { owner, membership, onConfirm, loading, buttonProps } = props;
  return (
    <ConfirmButton
      onConfirm={onConfirm}
      confirmTitle={t('group.members_remove_confirmation_title')}
      confirmMessage={t('group.members_remove_confirmation_message', {
        userName: t('user.full_name', { user: membership.user }),
        name: _.get('name', owner),
      })}
      confirmButton={t('group.members_remove_confirmation_button')}
      buttonLabel={t('group.members_list_remove')}
      buttonProps={buttonProps}
      loading={loading}
    />
  );
};

export default GroupMemberRemove;
