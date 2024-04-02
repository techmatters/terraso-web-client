/*
 * Copyright © 2023 Technology Matters
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
import _ from 'lodash/fp';
import { useTranslation } from 'react-i18next';

const CollaborationContext = React.createContext();

export const CollaborationContextProvider = props => {
  const { t } = useTranslation();
  const { entityType } = props;

  const entityTypeLocalized = useMemo(
    () => t('collaboration.entity_type', { context: entityType }),
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
          'accountMembership',
          'membershipInfo',
          'onMemberJoin',
          'onMemberRemove',
          'onMemberRoleChange',
          'onMemberApprove',
          'MemberLeaveButton',
          'MemberRemoveButton',
          'MemberJoinButton',
          'MemberRequestJoinButton',
          'MemberRequestCancelButton',
          'updateOwner',
          'acceptedRoles',
          'allowedToManageMembers',
        ],
        props
      ),
    }),
    [entityType, entityTypeLocalized, props]
  );

  return (
    <CollaborationContext.Provider value={providerValue}>
      {props.children}
    </CollaborationContext.Provider>
  );
};

export const useCollaborationContext = () => {
  const context = useContext(CollaborationContext);
  return context;
};
