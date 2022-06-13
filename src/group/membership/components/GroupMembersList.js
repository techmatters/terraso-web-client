import React, { useContext, useEffect } from 'react';

import _ from 'lodash/fp';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { useSearchParams } from 'react-router-dom';

import { MenuItem, Select, Stack, Typography } from '@mui/material';

import TableResponsive from 'common/components/TableResponsive';
import PageLoader from 'layout/PageLoader';
import Restricted from 'permissions/components/Restricted';

import AccountAvatar from 'account/components/AccountAvatar';
import { useGroupContext } from 'group/groupContext';
import { fetchMembers, removeMember, updateMemberRole } from 'group/groupSlice';

import theme from 'theme';

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

  const onMemberRoleChange = (member, newRole) => {
    dispatch(updateMemberRole({ member, newRole }));
  };

  const listContext = {
    onMemberRoleChange,
    onMemberRemove,
    members: _.values(members),
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
      renderCell: ({ row: member }) => (
        <Stack
          direction="row"
          justifyContent="flex-start"
          alignItems="center"
          spacing={2}
        >
          <AccountAvatar sx={{ width: 34, height: 34 }} user={member} />
          <Typography>{t('user.full_name', { user: member })}</Typography>
        </Stack>
      ),
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

  return (
    <GroupMembersListContext.Provider value={listContext}>
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{
          marginTop: theme.spacing(2),
          marginBottom: theme.spacing(2),
        }}
      >
        <Restricted permission="group.manageMembers" resource={owner}>
          <Typography variant="h2">
            {t('group.members_list_title', { name: _.get('name', owner) })}
          </Typography>
        </Restricted>
      </Stack>
      <TableResponsive
        columns={columns}
        rows={_.values(members)}
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
    </GroupMembersListContext.Provider>
  );
};

export default GroupMembersList;
