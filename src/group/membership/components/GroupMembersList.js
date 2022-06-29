import React, { useContext, useEffect } from 'react';

import _ from 'lodash/fp';
import { usePermission } from 'permissions';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { useSearchParams } from 'react-router-dom';

import WarningIcon from '@mui/icons-material/Warning';
import { LoadingButton } from '@mui/lab';
import { ListItem, MenuItem, Select, Stack, Typography } from '@mui/material';

import ConfirmButton from 'common/components/ConfirmButton';
import List from 'common/components/List';
import TableResponsive from 'common/components/TableResponsive';
import PageLoader from 'layout/PageLoader';
import Restricted from 'permissions/components/Restricted';

import AccountAvatar from 'account/components/AccountAvatar';
import { useGroupContext } from 'group/groupContext';
import { fetchMembers, removeMember, updateMember } from 'group/groupSlice';

import {
  MEMBERSHIP_STATUS_APPROVED,
  MEMBERSHIP_STATUS_PENDING,
} from './groupMembershipConstants';

const ROLES = ['MEMBER', 'MANAGER'];

const GroupMembersListContext = React.createContext();

const RoleSelect = ({ member }) => {
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
        <Typography>{t(`group.role_${member.role.toLowerCase()}`)}</Typography>
      )}
    >
      <Select
        variant="standard"
        value={member.role}
        onChange={onChange}
        disabled={member.fetching}
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

const RemoveButton = ({ member }) => {
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
      />
    </Restricted>
  );
};

const MemberName = ({ member }) => {
  const { t } = useTranslation();
  return (
    <Stack
      direction="row"
      justifyContent="flex-start"
      alignItems="center"
      spacing={2}
    >
      <AccountAvatar sx={{ width: 34, height: 34 }} user={member} />
      <Typography>{t('user.full_name', { user: member })}</Typography>
    </Stack>
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
      <Stack direction="row" spacing={1} sx={{ marginBottom: 2 }}>
        <WarningIcon sx={{ color: 'gray.mid2' }} />
        <Typography>
          {t('group.members_list_pending_message', { count: pending.length })}
        </Typography>
      </Stack>
      <List>
        {pending.map(member => (
          <ListItem
            key={member.id}
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
  const { list: members, fetching } = useSelector(state => state.group.members);

  const { owner, groupSlug } = useGroupContext();

  useEffect(() => {
    dispatch(fetchMembers(groupSlug));
  }, [dispatch, groupSlug]);

  if (fetching) {
    return <PageLoader />;
  }

  const onMemberRemove = member => {
    dispatch(removeMember(member));
  };

  const onUpdateMember = member => dispatch(updateMember({ member }));

  const onMemberRoleChange = (member, newRole) => {
    onUpdateMember({
      id: member.membershipId,
      userRole: newRole,
    });
  };

  const onMemberApprove = member => {
    onUpdateMember({
      id: member.membershipId,
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

  const columns = [
    {
      field: 'name',
      headerName: t('group.members_list_column_name'),
      flex: 1.5,
      minWidth: 200,
      valueGetter: ({ row: member }) => t('user.full_name', { user: member }),
      cardRender: ({ row: member }) => (
        <Typography>{t('user.full_name', { user: member })}</Typography>
      ),
      renderCell: ({ row: member }) => <MemberName member={member} />,
    },
    {
      field: 'role',
      type: 'actions',
      headerName: t('group.members_list_column_role'),
      flex: 1.5,
      minWidth: 200,
      cardSize: 6,
      valueGetter: ({ row: member }) =>
        t(`group.role_${member.role.toLowerCase()}`),
      getActions: ({ row: member }) => [<RoleSelect member={member} />],
    },
    {
      field: 'actions',
      headerName: t('group.members_list_column_actions_description'),
      type: 'actions',
      sortable: false,
      flex: 1.5,
      minWidth: 200,
      align: 'center',
      cardSize: 6,
      getActions: ({ row: member }) => [<RemoveButton member={member} />],
    },
  ];

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
        <TableResponsive
          columns={columns}
          rows={listContext.members}
          emptyMessage={t('group.members_list_empty')}
          searchParams={Object.fromEntries(searchParams.entries())}
          onSearchParamsChange={setSearchParams}
          cardsProps={{
            avatarRender: ({ row: member }) => (
              <AccountAvatar sx={{ width: 80, height: 80 }} user={member} />
            ),
          }}
          tableProps={{
            initialSort: [
              {
                field: 'name',
                sort: 'asc',
              },
            ],
          }}
        />
      </section>
    </GroupMembersListContext.Provider>
  );
};

export default GroupMembersList;
