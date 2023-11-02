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
import React, { useContext, useMemo } from 'react';
import _ from 'lodash/fp.js';
import { useTranslation } from 'react-i18next';

const GroupContext = React.createContext();

export const GroupContextProvider = props => {
  const { t } = useTranslation();

  const entityType = useMemo(
    () => (props?.owner?.defaultGroup ? 'landscape' : 'group'),
    [props?.owner?.defaultGroup]
  );

  const entityTypeLocalized = useMemo(
    () => t('sharedData.entity_type', { context: entityType }),
    [entityType, t]
  );

  const providerValue = useMemo(
    () => ({
      entityType,
      entityTypeLocalized,
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
    }),
    [entityType, entityTypeLocalized, props]
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
