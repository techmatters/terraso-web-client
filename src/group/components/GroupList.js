import React, { useEffect } from 'react';
import _ from 'lodash';
import { useSelector, useDispatch } from 'react-redux';
import { useSnackbar } from 'notistack';
import { useTranslation } from 'react-i18next';
import useMediaQuery from '@mui/material/useMediaQuery';
import { Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Typography,
  Backdrop,
  CircularProgress,
  Link,
  Grid,
  Card,
  Button,
  List,
  ListItem
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';

import { fetchGroups } from 'group/groupSlice';
import GroupMembershipButton from 'group/components/GroupMembershipButton';
import GroupMembershipCount from 'group/components/GroupMembershipCount';
import theme from 'theme';

const PAGE_SIZE = 10;

const MembershipButton = ({ group }) => (
  <GroupMembershipButton
    groupSlug={group.slug}
    joinLabel="group.list_join_button"
    leaveLabel="group.list_leave_button"
    ownerName={group.name}
    sx={{ width: '100%' }}
  />
);

const GroupTable = ({ groups }) => {
  const { t } = useTranslation();

  const columns = [{
    field: 'name',
    headerName: t('group.list_column_name'),
    flex: 1.5,
    minWidth: 200,
    renderCell: ({ row: group }) =>
      <Link component={RouterLink} to={`/groups/${group.slug}`}>
        {group.name}
      </Link>
  }, {
    field: 'email',
    headerName: t('group.list_column_contact'),
    sortable: false,
    flex: 1.5,
    minWidth: 200,
    renderCell: ({ row: group }) =>
      <Link href={`mailto:${group.email}`} underline="none">
        {group.email}
      </Link>
  }, {
    field: 'website',
    headerName: t('group.list_column_website'),
    sortable: false,
    flex: 1.5,
    minWidth: 200,
    renderCell: ({ row: group }) =>
      <Link href={group.website} underline="none">
        {group.website}
      </Link>
  }, {
    field: 'members',
    headerName: t('group.list_column_members'),
    align: 'center',
    valueGetter: ({ row: group }) => _.get(group, 'members.length', 0),
    renderCell: ({ row: group }) => (
      <GroupMembershipCount groupSlug={group.slug} />
    )
  }, {
    field: 'actions',
    headerName: t('group.list_column_actions'),
    sortable: false,
    align: 'center',
    renderCell: ({ row: group }) => (
      <MembershipButton group={group} />
    )
  }];

  return (
    <DataGrid
      rows={groups}
      columns={columns}
      pageSize={PAGE_SIZE}
      rowsPerPageOptions={[PAGE_SIZE]}
      autoHeight
      disableVirtualization
      sx={{
        '& .MuiDataGrid-columnHeaders': {
          backgroundColor: 'gray.lite2'
        }
      }}
      localeText={{
        noRowsLabel: t('group.list_empty'),
        footerPaginationRowsPerPage: t('common.data_grid_pagination_of')
      }}
    />
  );
};

const GroupCards = ({ groups }) => {
  const { t } = useTranslation();

  return (
    <List>
      {groups.map(group => (
        <ListItem key={group.slug} sx={{ padding: 0, marginBottom: theme.spacing(2) }}>
          <Card sx={{ width: '100%', padding: theme.spacing(2) }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Typography variant="caption">
                  {t('group.list_column_name')}
                </Typography>
                <Typography variant="body1">
                  {group.name}
                </Typography>
              </Grid>
              {group.email && (
                <Grid item xs={12}>
                  <Typography variant="caption">
                    {t('group.list_column_contact')}
                  </Typography>
                  <Link component={Box} href={`mailto:${group.website}`} underline="none">
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
  const { enqueueSnackbar } = useSnackbar();
  const isSmall = useMediaQuery(theme.breakpoints.down('md'));

  useEffect(() => {
    dispatch(fetchGroups());
  }, [dispatch]);

  useEffect(() => {
    if (message) {
      enqueueSnackbar(message);
    }
  }, [message, enqueueSnackbar]);

  if (fetching) {
    return (
      <Backdrop
        sx={{ color: 'white', zIndex: (theme) => theme.zIndex.drawer + 1 }}
        open={true}
      >
        <CircularProgress color="inherit" />
      </Backdrop>
    );
  }

  if (message && message.severity === 'error') {
    return null;
  }

  return (
    <Box sx={{
      paddingTop: theme.spacing(3),
      paddingBottom: theme.spacing(2)
    }}>
      <Typography variant="h1" >
        {t('group.list_title')}
      </Typography>
      <Typography
        variant="body2"
        display="block"
        sx={{
          marginBottom: theme.spacing(3),
          marginTop: theme.spacing(2)
        }}
      >
        {t('group.list_description')}
      </Typography>
      {isSmall
        ? <GroupCards groups={groups} />
        : <GroupTable groups={groups} />
      }
      <Typography
        variant="body2"
        display="block"
        sx={{
          marginTop: theme.spacing(2),
          marginBottom: theme.spacing(2)
        }}
      >
        {t('group.list_new_description')}
      </Typography>
      <Button
        variant="contained"
        component={RouterLink}
        to="/groups/new"
      >
        {t('group.list_new_button')}
      </Button>
    </Box>
  );
};

export default GroupList;
