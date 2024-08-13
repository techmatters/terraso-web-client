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

import React, { useMemo } from 'react';
import _ from 'lodash/fp';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { LoadingButton } from '@mui/lab';
import { ListItem, Stack, Typography } from '@mui/material';

import { withProps } from 'react-hoc';

import {
  MEMBERSHIP_STATUS_APPROVED,
  MEMBERSHIP_STATUS_PENDING,
} from 'collaboration/collaborationConstants';
import { useCollaborationContext } from 'collaboration/collaborationContext';
import MemberName from 'collaboration/components/MemberName';
import MembershipsList from 'collaboration/components/MembershipsList';
import RoleSelect from 'collaboration/components/RoleSelect';
import ConfirmButton from 'common/components/ConfirmButton';
import List from 'common/components/List';
import PageContainer from 'layout/PageContainer';
import PageHeader from 'layout/PageHeader';

import MembershipPendingWarning from './MembershipPendingWarning';

const Header = () => {
  const { t } = useTranslation();
  const { owner, allowedToManageMembers, entityTypeLocalized } =
    useCollaborationContext();

  return (
    <>
      <PageHeader
        header={t(
          allowedToManageMembers
            ? 'collaboration.members_title_manager'
            : 'collaboration.members_title_member',
          { name: _.get('name', owner) }
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
          allowedToManageMembers
            ? 'collaboration.members_description_manager'
            : 'collaboration.members_description_member',
          { name: _.get('name', owner), entityType: entityTypeLocalized }
        )}
      </Typography>
    </>
  );
};

const RemoveButton = props => {
  const { membership, tabIndex } = props;
  const { data: currentUser } = useSelector(state => state.account.currentUser);
  const {
    owner,
    onMemberRemove,
    MemberLeaveButton,
    MemberRemoveButton,
    allowedToManageMembers,
  } = useCollaborationContext();

  if (membership.user.email === currentUser.email) {
    return (
      <MemberLeaveButton
        onConfirm={() => onMemberRemove(membership)}
        owner={owner}
        loading={membership.fetching}
        buttonProps={{ tabIndex }}
      />
    );
  }

  if (!allowedToManageMembers) {
    return null;
  }

  return (
    <MemberRemoveButton
      onConfirm={() => onMemberRemove(membership)}
      owner={owner}
      membership={membership}
      loading={membership.fetching}
      buttonProps={{ tabIndex }}
    />
  );
};

const PendingApprovals = props => {
  const { t } = useTranslation();
  const { memberships } = props;
  const { owner, allowedToManageMembers, onMemberApprove, onMemberRemove } =
    useCollaborationContext();

  if (!allowedToManageMembers || _.isEmpty(memberships)) {
    return null;
  }

  return (
    <section aria-labelledby="members-pending-title-id">
      <Typography
        id="members-pending-title-id"
        variant="h2"
        sx={{ marginBottom: 2 }}
      >
        {t('collaboration.members_list_pending_title')}
      </Typography>
      <MembershipPendingWarning count={memberships.length} sx={{ mb: 2 }} />
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
                  {t('collaboration.members_list_pending_approve')}
                </LoadingButton>
                <ConfirmButton
                  onConfirm={() => onMemberRemove(membership)}
                  confirmTitle={t(
                    'collaboration.members_list_pending_confirmation_title'
                  )}
                  confirmMessage={t(
                    'collaboration.members_list_pending_confirmation_message',
                    {
                      userName: t('user.full_name', { user: membership.user }),
                      name: owner?.name,
                    }
                  )}
                  confirmButton={t(
                    'collaboration.members_list_pending_confirmation_button'
                  )}
                  buttonLabel={t('collaboration.members_list_pending_reject')}
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

const MembersPage = () => {
  const { owner, acceptedRoles, allowedToManageMembers, onMemberRoleChange } =
    useCollaborationContext();
  const { t } = useTranslation();

  const memberships = useMemo(
    () => owner?.membershipInfo?.memberships || [],
    [owner]
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

  return (
    <PageContainer>
      <Header />
      <PendingApprovals memberships={pendingMemberships} />
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
          {allowedToManageMembers && (
            <Typography variant="h2" id="members-list-title-id">
              {t('collaboration.members_list_title', {
                name: owner?.name,
              })}
            </Typography>
          )}
        </Stack>
        <MembershipsList
          memberships={activeMemberships}
          RoleComponent={withProps(RoleSelect, {
            roles: acceptedRoles,
            allowedToManageMembers,
            label: t('collaboration.members_list_role_select_label'),
            onMemberRoleChange,
          })}
          RemoveComponent={RemoveButton}
        />
      </section>
    </PageContainer>
  );
};

export default MembersPage;
