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

import React, { useCallback, useMemo } from 'react';
import _ from 'lodash/fp';
import { usePermission, usePermissionRedirect } from 'permissions';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { useFetchData } from 'terraso-client-shared/store/utils';
import { useDispatch } from 'terrasoApi/store';

import { withProps } from 'react-hoc';

import { MEMBERSHIP_STATUS_APPROVED } from 'collaboration/collaborationConstants';
import { CollaborationContextProvider } from 'collaboration/collaborationContext';
import MembersPage from 'collaboration/components/MembersPage';
import { useDocumentDescription, useDocumentTitle } from 'common/document';
import PageLoader from 'layout/PageLoader';
import { useBreadcrumbsParams } from 'navigation/breadcrumbsContext';
import {
  changeMemberRole,
  fetchGroupForMembers,
  removeMember,
} from 'group/groupSlice';
import GroupMemberLeave from 'group/membership/components/GroupMemberLeave';
import GroupMemberRemove from 'group/membership/components/GroupMemberRemove';

import { ALL_MEMBERSHIP_ROLES } from './groupMembershipConstants';

const MemberLeaveButton = withProps(GroupMemberLeave, {
  label: 'group.members_list_leave',
});

const GroupMembers = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { slug } = useParams();
  const { data: group, fetching } = useSelector(state => state.group.members);

  useFetchData(useCallback(() => fetchGroupForMembers(slug), [slug]));

  const roles = useMemo(
    () =>
      ALL_MEMBERSHIP_ROLES.map(role => ({
        key: role,
        value: role,
        label: t(`group.role_${role.toLowerCase()}`),
      })),
    [t]
  );

  const onMemberRoleChange = useCallback(
    (membership, newRole) => {
      dispatch(
        changeMemberRole({
          groupSlug: group.slug,
          userEmails: [membership.user.email],
          userRole: newRole,
          membershipStatus: MEMBERSHIP_STATUS_APPROVED,
        })
      );
    },
    [dispatch, group]
  );
  const onMemberApprove = useCallback(
    membership => {
      dispatch(
        changeMemberRole({
          groupSlug: group.slug,
          userEmails: [membership.user.email],
          membershipStatus: MEMBERSHIP_STATUS_APPROVED,
        })
      );
    },
    [dispatch, group]
  );
  const onMemberRemove = useCallback(
    membership => {
      dispatch(
        removeMember({
          groupSlug: group.slug,
          id: membership.id,
          email: membership.user.email,
        })
      );
    },
    [dispatch, group]
  );

  useDocumentTitle(
    t('group.members_document_title', {
      name: _.get('name', group),
    }),
    fetching
  );

  useDocumentDescription(
    t('group.members_document_description', {
      name: _.get('name', group),
    }),
    fetching
  );

  useBreadcrumbsParams(
    useMemo(
      () => ({ groupName: group?.name, loading: !group?.name }),
      [group?.name]
    )
  );

  const { loading: loadingPermissions, allowed: allowedToManageMembers } =
    usePermission('group.manageMembers', group);

  const { loading } = usePermissionRedirect(
    'group.viewMembers',
    group,
    useMemo(() => `/groups/${group?.slug}`, [group?.slug])
  );

  if (fetching || loading || loadingPermissions) {
    return <PageLoader />;
  }

  return (
    <CollaborationContextProvider
      owner={group}
      entityType="group"
      onMemberRoleChange={onMemberRoleChange}
      onMemberRemove={onMemberRemove}
      onMemberApprove={onMemberApprove}
      MemberLeaveButton={MemberLeaveButton}
      MemberRemoveButton={GroupMemberRemove}
      acceptedRoles={roles}
      allowedToManageMembers={allowedToManageMembers}
    >
      <MembersPage />
    </CollaborationContextProvider>
  );
};

export default GroupMembers;
