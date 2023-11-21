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
import { LoadingButton } from '@mui/lab';
import { ListItem, Stack, Typography } from '@mui/material';

import { withProps } from 'react-hoc';

import {
  MEMBERSHIP_STATUS_APPROVED,
  MEMBERSHIP_STATUS_PENDING,
} from 'collaboration/collaborationConstants';
import MemberName from 'collaboration/components/MemberName';
import MembershipsList from 'collaboration/components/MembershipsList';
import RoleSelect from 'collaboration/components/RoleSelect';
import ConfirmButton from 'common/components/ConfirmButton';
import List from 'common/components/List';
import { useDocumentDescription, useDocumentTitle } from 'common/document';
import PageContainer from 'layout/PageContainer';
import PageHeader from 'layout/PageHeader';
import PageLoader from 'layout/PageLoader';
import { useBreadcrumbsParams } from 'navigation/breadcrumbsContext';
import Restricted from 'permissions/components/Restricted';
import {
  changeMemberRole,
  fetchGroupForMembers,
  removeMember,
} from 'group/groupSlice';
import GroupMemberLeave from 'group/membership/components/GroupMemberLeave';
import GroupMemberRemove from 'group/membership/components/GroupMemberRemove';

import { ALL_MEMBERSHIP_ROLES } from './groupMembershipConstants';
import GroupMembershipPendingWarning from './GroupMembershipPendingWarning';

const MemberLeaveButton = withProps(GroupMemberLeave, {
  label: 'group.members_list_leave',
});

const Header = props => {
  const { t } = useTranslation();
  const { group, fetching } = props;

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

  const { loading: loadingPermissions, allowed } = usePermission(
    'group.manageMembers',
    group
  );

  const { loading } = usePermissionRedirect(
    'group.viewMembers',
    group,
    useMemo(() => `/groups/${group?.slug}`, [group?.slug])
  );

  if (fetching || loading || loadingPermissions) {
    return null;
  }

  return (
    <>
      <PageHeader
        header={t(
          allowed
            ? 'group.members_title_manager'
            : 'group.members_title_member',
          { name: _.get('name', group) }
        )}
      />
      <Typography
        variant="body2"
        display="block"
        sx={{
          marginBottom: 3,
          marginTop: 2,
        }}
      >
        {t(
          allowed
            ? 'group.members_description_manager'
            : 'group.members_description_member',
          { name: _.get('name', group) }
        )}
      </Typography>
    </>
  );
};

const RemoveButton = props => {
  const dispatch = useDispatch();
  const { group, membership, tabIndex } = props;
  const { data: currentUser } = useSelector(state => state.account.currentUser);

  const onConfirm = useCallback(() => {
    dispatch(
      removeMember({
        groupSlug: group.slug,
        id: membership.id,
        email: membership.user.email,
      })
    );
  }, [dispatch, group, membership]);

  if (membership.user.email === currentUser.email) {
    return (
      <MemberLeaveButton
        onConfirm={onConfirm}
        owner={group}
        loading={membership.fetching}
        buttonProps={{ tabIndex }}
      />
    );
  }

  return (
    <Restricted permission="group.manageMembers" resource={group}>
      <GroupMemberRemove
        onConfirm={onConfirm}
        owner={group}
        membership={membership}
        loading={membership.fetching}
        buttonProps={{ tabIndex }}
      />
    </Restricted>
  );
};

const PendingApprovals = props => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { memberships, group } = props;
  const { allowed } = usePermission('group.manageMembers', group);

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

  if (!allowed || _.isEmpty(memberships)) {
    return null;
  }

  return (
    <section aria-labelledby="members-pending-title-id">
      <Typography
        id="members-pending-title-id"
        variant="h2"
        sx={{ marginBottom: 2 }}
      >
        {t('group.members_list_pending_title')}
      </Typography>
      <GroupMembershipPendingWarning
        count={memberships.length}
        sx={{ mb: 2 }}
      />
      <List aria-labelledby="members-pending-title-id">
        {memberships.map(membership => (
          <ListItem
            key={membership.membershipId}
            aria-label={t('user.full_name', { user: membership.user })}
            secondaryAction={
              <Stack spacing={2} direction="row">
                <LoadingButton
                  variant="contained"
                  loading={membership.fetching}
                  onClick={() => onMemberApprove(membership)}
                >
                  {t('group.members_list_pending_approve')}
                </LoadingButton>
                <ConfirmButton
                  onConfirm={() => onMemberRemove(membership)}
                  confirmTitle={t(
                    'group.members_list_pending_confirmation_title'
                  )}
                  confirmMessage={t(
                    'group.members_list_pending_confirmation_message',
                    {
                      userName: t('user.full_name', { user: membership.user }),
                      name: group?.name,
                    }
                  )}
                  confirmButton={t(
                    'group.members_list_pending_confirmation_button'
                  )}
                  buttonLabel={t('group.members_list_pending_reject')}
                  loading={membership.fetching}
                />
              </Stack>
            }
          >
            <MemberName membership={membership} />
          </ListItem>
        ))}
      </List>
    </section>
  );
};

const GroupMembers = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { slug } = useParams();
  const { data: group, fetching } = useSelector(state => state.group.members);

  useFetchData(useCallback(() => fetchGroupForMembers(slug), [slug]));

  const memberships = useMemo(
    () => group?.membershipsInfo?.membershipsSample || [],
    [group]
  );

  const { pendingMemberships, activeMemberships } = useMemo(() => {
    const groupedByStatus = _.flow(
      _.values,
      _.groupBy('membershipStatus')
    )(memberships);

    return {
      pendingMemberships: groupedByStatus[MEMBERSHIP_STATUS_PENDING],
      activeMemberships: groupedByStatus[MEMBERSHIP_STATUS_APPROVED],
    };
  }, [memberships]);

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
        })
      );
    },
    [dispatch, group]
  );

  if (fetching) {
    return <PageLoader />;
  }

  return (
    <PageContainer>
      <Header group={group} fetching={fetching} />
      <PendingApprovals memberships={pendingMemberships} group={group} />
      <section aria-labelledby="members-list-title-id">
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{
            marginTop: 2,
            marginBottom: 2,
          }}
        >
          <Restricted permission="group.manageMembers" resource={group}>
            <Typography variant="h2" id="members-list-title-id">
              {t('group.members_list_title', {
                name: group?.name,
              })}
            </Typography>
          </Restricted>
        </Stack>
        <MembershipsList
          memberships={activeMemberships}
          RoleComponent={withProps(RoleSelect, {
            roles,
            permission: 'group.manageMembers',
            resource: group,
            label: t('memberships.members_list_role_select_label'),
            onMemberRoleChange,
          })}
          RemoveComponent={withProps(RemoveButton, {
            group,
          })}
        />
      </section>
    </PageContainer>
  );
};

export default GroupMembers;
