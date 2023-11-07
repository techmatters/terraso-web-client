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
import React, { useCallback, useContext } from 'react';
import _ from 'lodash/fp';
import { usePermission } from 'permissions';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import {
  fetchMembers,
  removeMember,
  updateMember,
} from 'terraso-client-shared/memberships/membershipsSlice';
import { useFetchData } from 'terraso-client-shared/store/utils';
import { useDispatch, useSelector } from 'terrasoApi/store';
import { LoadingButton } from '@mui/lab';
import { ListItem, MenuItem, Select, Stack, Typography } from '@mui/material';

import MemberName from 'collaboration/components/MemberName';
import MembershipsList from 'collaboration/components/MembershipsList';
import ConfirmButton from 'common/components/ConfirmButton';
import List from 'common/components/List';
import PageLoader from 'layout/PageLoader';
import Restricted from 'permissions/components/Restricted';
import { useGroupContext } from 'group/groupContext';

import {
  MEMBERSHIP_STATUS_APPROVED,
  MEMBERSHIP_STATUS_PENDING,
} from './groupMembershipConstants';
import GroupMembershipPendingWarning from './GroupMembershipPendingWarning';

const ROLES = ['MEMBER', 'MANAGER'];

const GroupMembersListContext = React.createContext();

const RoleSelect = ({ member, tabIndex }) => {
  const { t } = useTranslation();
  const { owner } = useGroupContext();
  const { onMemberRoleChange } = useContext(GroupMembersListContext);

  const onChange = event => {
    const newRole = event.target.value;
    onMemberRoleChange(member, newRole);
  };

  return (
    <Restricted
      permission="group.manageMembers"
      resource={owner}
      FallbackComponent={() => (
        <Typography>
          {t(`group.role_${member.userRole.toLowerCase()}`)}
        </Typography>
      )}
    >
      <Select
        variant="standard"
        value={member.userRole}
        onChange={onChange}
        disabled={member.fetching}
        inputProps={{
          tabIndex,
          'aria-label': t('memberships.members_list_role_select_label'),
        }}
        disableUnderline
      >
        {ROLES.map(role => (
          <MenuItem key={role} value={role}>
            {t(`group.role_${role.toLowerCase()}`)}
          </MenuItem>
        ))}
      </Select>
    </Restricted>
  );
};

const RemoveButton = ({ member, tabIndex }) => {
  const { owner, MemberLeaveButton, MemberRemoveButton } = useGroupContext();
  const { onMemberRemove } = useContext(GroupMembersListContext);
  const { data: currentUser } = useSelector(state => state.account.currentUser);

  const onConfirm = () => {
    onMemberRemove(member);
  };

  if (member.email === currentUser.email) {
    return (
      <MemberLeaveButton
        onConfirm={onConfirm}
        owner={owner}
        loading={member.fetching}
        buttonProps={{ tabIndex }}
      />
    );
  }

  return (
    <Restricted permission="group.manageMembers" resource={owner}>
      <MemberRemoveButton
        onConfirm={onConfirm}
        owner={owner}
        member={member}
        loading={member.fetching}
        buttonProps={{ tabIndex }}
      />
    </Restricted>
  );
};

const PendingApprovals = () => {
  const { t } = useTranslation();
  const { group, owner } = useGroupContext();
  const { pending, onMemberApprove, onMemberRemove } = useContext(
    GroupMembersListContext
  );
  const { allowed } = usePermission('group.manageMembers', group);

  if (!allowed || _.isEmpty(pending)) {
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
      <GroupMembershipPendingWarning count={pending.length} sx={{ mb: 2 }} />
      <List>
        {pending.map(member => (
          <ListItem
            key={member.membershipId}
            secondaryAction={
              <Stack spacing={2} direction="row">
                <LoadingButton
                  variant="contained"
                  loading={member.fetching}
                  onClick={() => onMemberApprove(member)}
                >
                  {t('group.members_list_pending_approve')}
                </LoadingButton>
                <ConfirmButton
                  onConfirm={() => onMemberRemove(member)}
                  confirmTitle={t(
                    'group.members_list_pending_confirmation_title'
                  )}
                  confirmMessage={t(
                    'group.members_list_pending_confirmation_message',
                    {
                      userName: t('user.full_name', { user: member }),
                      name: _.get('name', owner),
                    }
                  )}
                  confirmButton={t(
                    'group.members_list_pending_confirmation_button'
                  )}
                  buttonLabel={t('group.members_list_pending_reject')}
                  loading={member.fetching}
                />
              </Stack>
            }
          >
            <MemberName member={member} />
          </ListItem>
        ))}
      </List>
    </section>
  );
};

const GroupMembersList = () => {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { list: members, fetching } = useSelector(
    state => state.memberships.members
  );

  const { owner, groupSlug } = useGroupContext();

  useFetchData(useCallback(() => fetchMembers(groupSlug), [groupSlug]));

  if (fetching) {
    return <PageLoader />;
  }

  const onMemberRemove = member => {
    dispatch(removeMember(member));
  };

  const onUpdateMember = member => dispatch(updateMember({ member }));

  const onMemberRoleChange = (member, newRole) => {
    onUpdateMember({
      membershipId: member.membershipId,
      userRole: newRole,
    });
  };

  const onMemberApprove = member => {
    onUpdateMember({
      membershipId: member.membershipId,
      membershipStatus: MEMBERSHIP_STATUS_APPROVED,
    });
  };

  const groupedByStatus = _.flow(
    _.values,
    _.groupBy('membershipStatus')
  )(members);

  const listContext = {
    onMemberRoleChange,
    onMemberRemove,
    onMemberApprove,
    pending: groupedByStatus[MEMBERSHIP_STATUS_PENDING],
    members: groupedByStatus[MEMBERSHIP_STATUS_APPROVED],
  };

  const membersTitle = t('group.members_list_title', {
    name: _.get('name', owner),
  });

  return (
    <GroupMembersListContext.Provider value={listContext}>
      <PendingApprovals />
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
          <Restricted permission="group.manageMembers" resource={owner}>
            <Typography variant="h2" id="members-list-title-id">
              {membersTitle}
            </Typography>
          </Restricted>
        </Stack>
        <MembershipsList
          memberships={listContext.members}
          searchParams={searchParams}
          setSearchParams={setSearchParams}
          RoleComponent={RoleSelect}
          RemoveComponent={RemoveButton}
        />
      </section>
    </GroupMembersListContext.Provider>
  );
};

export default GroupMembersList;
