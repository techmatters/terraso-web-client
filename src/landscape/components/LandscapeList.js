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
  List,
  ListItem,
} from '@mui/material';

import { fetchLandscapes } from 'landscape/landscapeSlice';
import { withProps } from 'react-hoc';
import { useDocumentTitle } from 'common/document';
import GroupMembershipButton from 'group/membership/components/GroupMembershipButton';
import GroupMembershipCount from 'group/membership/components/GroupMembershipCount';
import Table from 'common/components/Table';
import PageLoader from 'common/components/PageLoader';
import PageHeader from 'common/components/PageHeader';
import PageContainer from 'common/components/PageContainer';
import { GroupContextProvider } from 'group/groupContext';
import LandscapeMemberLeave from 'landscape/membership/components/LandscapeMemberLeave';
import GroupMemberJoin from 'group/membership/components/GroupMemberJoin';

import theme from 'theme';

const MemberLeaveButton = withProps(LandscapeMemberLeave, {
  label: 'landscape.list_leave_button',
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
  label: 'landscape.list_join_button',
});

const MembershipButton = ({ landscape }) => (
  <GroupContextProvider
    owner={landscape}
    groupSlug={_.get('defaultGroup.slug', landscape)}
    MemberJoinButton={MemberJoinButton}
    MemberLeaveButton={MemberLeaveButton}
  >
    <GroupMembershipButton sx={{ width: '100%' }} />
  </GroupContextProvider>
);

const LandscapeTable = ({ landscapes }) => {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();

  const columns = [
    {
      field: 'name',
      headerName: t('landscape.list_column_name'),
      flex: 1.5,
      minWidth: 200,
      renderCell: ({ row: landscape }) => (
        <Link component={RouterLink} to={`/landscapes/${landscape.slug}`}>
          {landscape.name}
        </Link>
      ),
    },
    {
      field: 'location',
      headerName: t('landscape.list_column_location'),
      flex: 1.5,
      minWidth: 200,
    },
    {
      field: 'website',
      headerName: t('landscape.list_column_website'),
      sortable: false,
      flex: 1.5,
      minWidth: 200,
      renderCell: ({ row: landscape }) =>
        landscape.website && (
          <Link href={landscape.website} underline="none">
            {landscape.website}
          </Link>
        ),
    },
    {
      field: 'members',
      headerName: t('landscape.list_column_members'),
      align: 'center',
      valueGetter: ({ row: landscape }) =>
        _.getOr(0, 'defaultGroup.members.length', landscape),
      renderCell: ({ row: landscape }) => (
        <GroupMembershipCount groupSlug={landscape.defaultGroup.slug} />
      ),
    },
    {
      field: 'actions',
      type: 'actions',
      description: t('landscape.list_column_actions_description'),
      headerName: false,
      sortable: false,
      align: 'center',
      getActions: ({ row: landscape }) => [
        <MembershipButton landscape={landscape} />,
      ],
    },
  ];

  return (
    <Table
      rows={landscapes}
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
        noRowsLabel: t('landscape.list_empty'),
        footerPaginationRowsPerPage: t('common.data_grid_pagination_of'),
      }}
    />
  );
};

const LandscapeCards = ({ landscapes }) => {
  const { t } = useTranslation();

  return (
    <List>
      {landscapes.map(landscape => (
        <ListItem
          key={landscape.slug}
          sx={{ padding: 0, marginBottom: theme.spacing(2) }}
        >
          <Card sx={{ padding: theme.spacing(2), width: '100%' }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Typography variant="caption">
                  {t('landscape.list_column_name')}
                </Typography>
                <Link
                  variant="body1"
                  display="block"
                  component={RouterLink}
                  to={`/landscapes/${landscape.slug}`}
                >
                  {landscape.name}
                </Link>
              </Grid>
              {landscape.location && (
                <Grid item xs={12}>
                  <Typography variant="caption">
                    {t('landscape.list_column_location')}
                  </Typography>
                  <Typography variant="body1">{landscape.location}</Typography>
                </Grid>
              )}
              {landscape.website && (
                <Grid item xs={12}>
                  <Typography variant="caption">
                    {t('landscape.list_column_website')}
                  </Typography>
                  <Link
                    component={Box}
                    href={landscape.website}
                    underline="none"
                  >
                    {landscape.website}
                  </Link>
                </Grid>
              )}
              <Grid item xs={6}>
                <Typography variant="caption">
                  {t('landscape.list_column_members')}
                </Typography>
                <GroupMembershipCount groupSlug={landscape.defaultGroup.slug} />
              </Grid>
              <Grid item xs={6}>
                <MembershipButton landscape={landscape} />
              </Grid>
            </Grid>
          </Card>
        </ListItem>
      ))}
    </List>
  );
};

const LandscapeList = () => {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const { landscapes, fetching } = useSelector(state => state.landscape.list);
  const isSmall = useMediaQuery(theme.breakpoints.down('md'));

  useDocumentTitle(t('landscape.list_document_title'));

  useEffect(() => {
    dispatch(fetchLandscapes());
  }, [dispatch]);

  if (fetching) {
    return <PageLoader />;
  }

  return (
    <PageContainer>
      <PageHeader header={t('landscape.list_title')} />
      <Typography
        variant="body2"
        display="block"
        sx={{
          marginBottom: theme.spacing(3),
          marginTop: theme.spacing(2),
        }}
      ></Typography>
      {isSmall ? (
        <LandscapeCards landscapes={landscapes} />
      ) : (
        <LandscapeTable landscapes={landscapes} />
      )}
    </PageContainer>
  );
};

export default LandscapeList;
