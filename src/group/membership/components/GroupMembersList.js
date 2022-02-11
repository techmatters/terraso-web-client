import React, { useEffect, useContext } from 'react';
import _ from 'lodash/fp';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import useMediaQuery from '@mui/material/useMediaQuery';
import {
  Card,
  Grid,
  List,
  ListItem,
  MenuItem,
  Select,
  Stack,
  Typography,
} from '@mui/material';

import { fetchMembers, removeMember, updateMemberRole } from 'group/groupSlice';
import { useGroupContext } from 'group/groupContext';
import Table from 'common/components/Table';
import AccountAvatar from 'account/components/AccountAvatar';
import Restricted from 'permissions/components/Restricted';
import PageLoader from 'common/components/PageLoader';
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

const MembersTable = () => {
  const { t } = useTranslation();
  const { members } = useContext(GroupMembersListContext);
  const [searchParams, setSearchParams] = useSearchParams();

  const columns = [
    {
      field: 'name',
      headerName: t('group.members_list_column_name'),
      flex: 1.5,
      minWidth: 200,
      valueGetter: ({ row: member }) => t('user.full_name', { user: member }),
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
      getActions: ({ row: member }) => [<RemoveButton member={member} />],
    },
  ];

  return (
    <Table
      rows={members}
      columns={columns}
      initialSort={[
        {
          field: 'name',
          sort: 'asc',
        },
      ]}
      searchParams={Object.fromEntries(searchParams.entries())}
      onSearchParamsChange={setSearchParams}
      localeText={{
        noRowsLabel: t('group.members_list_empty'),
      }}
    />
  );
};

const MembersCards = () => {
  const { t } = useTranslation();
  const { members } = useContext(GroupMembersListContext);

  return (
    <List>
      {members.map(member => (
        <ListItem
          key={member.email}
          sx={{ padding: 0, marginBottom: theme.spacing(2) }}
        >
          <Card
            component={Stack}
            direction="row"
            alignItems="center"
            spacing={1}
            sx={{ width: '100%', padding: theme.spacing(1) }}
          >
            <AccountAvatar sx={{ width: 80, height: 80 }} user={member} />
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Typography variant="caption">
                  {t('group.members_list_column_name')}
                </Typography>
                <Typography variant="body1">
                  {t('user.full_name', { user: member })}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" display="block">
                  {t('group.members_list_column_role')}
                </Typography>
                <RoleSelect member={member} />
              </Grid>
              <Grid item xs={6}>
                <RemoveButton member={member} />
              </Grid>
            </Grid>
          </Card>
        </ListItem>
      ))}
    </List>
  );
};

const GroupMembersList = () => {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const isSmall = useMediaQuery(theme.breakpoints.down('md'));
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
      {isSmall ? <MembersCards /> : <MembersTable />}
    </GroupMembersListContext.Provider>
  );
};

export default GroupMembersList;
