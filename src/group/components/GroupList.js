import React, { useEffect } from 'react';
import _ from 'lodash/fp';
import { useSelector, useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import useMediaQuery from '@mui/material/useMediaQuery';
import { Link as RouterLink, useSearchParams } from 'react-router-dom';
import {
  Box,
  Typography,
  Link,
  Grid,
  Card,
  Button,
  List,
  ListItem,
} from '@mui/material';

import { fetchGroups } from 'group/groupSlice';
import { withProps } from 'react-hoc';
import GroupMembershipButton from 'group/membership/components/GroupMembershipButton';
import GroupMembershipCount from 'group/membership/components/GroupMembershipCount';
import Table from 'common/components/Table';
import PageLoader from 'common/components/PageLoader';
import { GroupContextProvider } from 'group/groupContext';
import GroupMemberLeave from 'group/membership/components/GroupMemberLeave';
import GroupMemberJoin from 'group/membership/components/GroupMemberJoin';
import theme from 'theme';

const MemberLeaveButton = withProps(GroupMemberLeave, {
  label: 'group.list_leave_button',
  buttonProps: {
    variant: 'contained',
    sx: {
      bgcolor: 'gray.lite1',
      color: 'black',
      textTransform: 'uppercase',
    },
  },
});

const MemberJoinButton = withProps(GroupMemberJoin, {
  label: 'group.list_join_button',
});

const MembershipButton = ({ group }) => (
  <GroupContextProvider
    owner={group}
    groupSlug={group.slug}
    MemberJoinButton={MemberJoinButton}
    MemberLeaveButton={MemberLeaveButton}
  >
    <GroupMembershipButton sx={{ width: '100%' }} />
  </GroupContextProvider>
);

const GroupTable = ({ groups }) => {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();

  const columns = [
    {
      field: 'name',
      headerName: t('group.list_column_name'),
      flex: 1.5,
      minWidth: 200,
      renderCell: ({ row: group }) => (
        <Link component={RouterLink} to={`/groups/${group.slug}`}>
          {group.name}
        </Link>
      ),
    },
    {
      field: 'email',
      headerName: t('group.list_column_contact'),
      sortable: false,
      flex: 1.5,
      minWidth: 200,
      renderCell: ({ row: group }) => (
        <Link href={`mailto:${group.email}`} underline="none">
          {group.email}
        </Link>
      ),
    },
    {
      field: 'website',
      headerName: t('group.list_column_website'),
      sortable: false,
      flex: 1.5,
      minWidth: 200,
      renderCell: ({ row: group }) => (
        <Link href={group.website} underline="none">
          {group.website}
        </Link>
      ),
    },
    {
      field: 'members',
      headerName: t('group.list_column_members'),
      align: 'center',
      valueGetter: ({ row: group }) => _.getOr(0, 'members.length', group),
      renderCell: ({ row: group }) => (
        <GroupMembershipCount groupSlug={group.slug} />
      ),
    },
    {
      field: 'actions',
      type: 'actions',
      headerName: false,
      sortable: false,
      align: 'center',
      getActions: ({ row: group }) => [<MembershipButton group={group} />],
    },
  ];

  return (
    <Table
      rows={groups}
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
        noRowsLabel: t('group.list_empty'),
        footerPaginationRowsPerPage: t('common.data_grid_pagination_of'),
      }}
    />
  );
};

const GroupCards = ({ groups }) => {
  const { t } = useTranslation();

  return (
    <List>
      {groups.map(group => (
        <ListItem
          key={group.slug}
          sx={{ padding: 0, marginBottom: theme.spacing(2) }}
        >
          <Card sx={{ width: '100%', padding: theme.spacing(2) }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Typography variant="caption">
                  {t('group.list_column_name')}
                </Typography>
                <Link
                  variant="body1"
                  display="block"
                  component={RouterLink}
                  to={`/groups/${group.slug}`}
                >
                  {group.name}
                </Link>
              </Grid>
              {group.email && (
                <Grid item xs={12}>
                  <Typography variant="caption">
                    {t('group.list_column_contact')}
                  </Typography>
                  <Link
                    component={Box}
                    href={`mailto:${group.website}`}
                    underline="none"
                  >
                    {group.email}
                  </Link>
                </Grid>
              )}
              {group.website && (
                <Grid item xs={12}>
                  <Typography variant="caption">
                    {t('group.list_column_website')}
                  </Typography>
                  <Link component={Box} href={group.website} underline="none">
                    {group.website}
                  </Link>
                </Grid>
              )}
              <Grid item xs={6}>
                <Typography variant="caption">
                  {t('group.list_column_members')}
                </Typography>
                <GroupMembershipCount groupSlug={group.slug} />
              </Grid>
              <Grid item xs={6}>
                <MembershipButton group={group} />
              </Grid>
            </Grid>
          </Card>
        </ListItem>
      ))}
    </List>
  );
};

const GroupList = () => {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const { groups, fetching, message } = useSelector(state => state.group.list);
  const isSmall = useMediaQuery(theme.breakpoints.down('md'));

  useEffect(() => {
    dispatch(fetchGroups());
  }, [dispatch]);

  if (fetching) {
    return <PageLoader />;
  }

  if (message && message.severity === 'error') {
    return null;
  }

  return (
    <Box
      sx={{
        paddingTop: theme.spacing(3),
        paddingBottom: theme.spacing(2),
      }}
    >
      <Typography variant="h1">{t('group.list_title')}</Typography>
      <Typography
        variant="body2"
        display="block"
        sx={{
          marginBottom: theme.spacing(3),
          marginTop: theme.spacing(2),
        }}
      >
        {t('group.list_description')}
      </Typography>
      {isSmall ? (
        <GroupCards groups={groups} />
      ) : (
        <GroupTable groups={groups} />
      )}
      <Typography
        variant="h2"
        sx={{
          marginTop: theme.spacing(4),
        }}
      >
        {t('group.create')}
      </Typography>

      <p>{t('group.list_new_description')}</p>

      <Button variant="contained" component={RouterLink} to="/groups/new">
        {t('group.list_new_button')}
      </Button>
    </Box>
  );
};

export default GroupList;
