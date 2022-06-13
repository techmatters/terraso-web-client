import React, { useEffect } from 'react';

import _ from 'lodash/fp';
import { Trans, useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { Link as RouterLink, useSearchParams } from 'react-router-dom';

import { Button, Link, Stack, Typography } from '@mui/material';

import TableResponsive from 'common/components/TableResponsive';
import { useDocumentTitle } from 'common/document';
import { countryNameForCode } from 'common/utils';
import PageContainer from 'layout/PageContainer';
import PageHeader from 'layout/PageHeader';
import PageLoader from 'layout/PageLoader';

import { GroupContextProvider } from 'group/groupContext';
import GroupMemberJoin from 'group/membership/components/GroupMemberJoin';
import GroupMembershipCount from 'group/membership/components/GroupMembershipCount';
import GroupMembershipJoinLeaveButton from 'group/membership/components/GroupMembershipJoinLeaveButton';
import { fetchLandscapes } from 'landscape/landscapeSlice';
import LandscapeMemberLeave from 'landscape/membership/components/LandscapeMemberLeave';

import { withProps } from 'react-hoc';

import theme from 'theme';

const MemberLeaveButton = withProps(LandscapeMemberLeave, {
  renderLabel: role =>
    role === 'MANAGER'
      ? 'landscape.list_manager_button'
      : 'landscape.list_member_button',
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
    <GroupMembershipJoinLeaveButton sx={{ width: '100%' }} />
  </GroupContextProvider>
);

const LandscapeList = () => {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { landscapes, fetching } = useSelector(state => state.landscape.list);

  useDocumentTitle(t('landscape.list_document_title'));

  useEffect(() => {
    dispatch(fetchLandscapes());
  }, [dispatch]);

  if (fetching) {
    return <PageLoader />;
  }

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
      valueGetter: ({ row: landscape }) =>
        landscape.location && countryNameForCode(landscape.location)?.name,
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
      cardSize: 6,
      valueGetter: ({ row: landscape }) =>
        _.getOr(0, 'defaultGroup.membersInfo.totalCount', landscape),
      renderCell: ({ row: landscape }) => (
        <GroupMembershipCount groupSlug={landscape.defaultGroup.slug} />
      ),
    },
    {
      field: 'actions',
      type: 'actions',
      headerName: t('landscape.list_column_actions_description'),
      sortable: false,
      align: 'center',
      cardSize: 6,
      getActions: ({ row: landscape }) => [
        <MembershipButton landscape={landscape} />,
      ],
    },
  ];

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
      <TableResponsive
        columns={columns}
        rows={landscapes}
        searchEnabled
        searchPlaceholder={t('landscape.list_search_placeholder')}
        searchFilterField="name"
        searchParams={Object.fromEntries(searchParams.entries())}
        onSearchParamsChange={setSearchParams}
        emptyMessage={
          <Trans i18nKey="landscape.list_empty">
            <Stack spacing={2}>
              <Typography>First</Typography>
              <Typography>
                Prefix
                <Link component={RouterLink} to={`/landscapes/new`}>
                  to add
                </Link>
                and
                <Link
                  href={t('landscape.list_search_manager_help_url')}
                  target="_blank"
                >
                  to help
                </Link>
                .
              </Typography>
            </Stack>
          </Trans>
        }
        tableProps={{
          initialSort: [
            {
              field: 'name',
              sort: 'asc',
            },
          ],
          localeText: {
            footerPaginationRowsPerPage: t('common.data_grid_pagination_of'),
          },
        }}
      />
      <Typography
        variant="h2"
        sx={{
          marginTop: theme.spacing(4),
        }}
      >
        {t('landscape.create')}
      </Typography>

      <p>{t('landscape.list_new_description')}</p>

      <Button variant="contained" component={RouterLink} to="/landscapes/new">
        {t('landscape.list_new_button')}
      </Button>
    </PageContainer>
  );
};

export default LandscapeList;
