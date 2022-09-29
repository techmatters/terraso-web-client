import React from 'react';

import { Trans, useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { Link as RouterLink, useSearchParams } from 'react-router-dom';

import { Button, Link, Stack, Typography } from '@mui/material';

import TableResponsive from 'common/components/TableResponsive';
import { useDocumentTitle } from 'common/document';
import PageContainer from 'layout/PageContainer';
import PageHeader from 'layout/PageHeader';
import PageLoader from 'layout/PageLoader';
import { useFetchData } from 'state/utils';

import { GroupContextProvider } from 'group/groupContext';
import { fetchGroups } from 'group/groupSlice';
import GroupMemberJoin from 'group/membership/components/GroupMemberJoin';
import GroupMemberLeave from 'group/membership/components/GroupMemberLeave';
import GroupMemberRequestCancel from 'group/membership/components/GroupMemberRequestCancel';
import GroupMembershipJoinLeaveButton from 'group/membership/components/GroupMembershipJoinLeaveButton';

import { withProps } from 'react-hoc';

import theme from 'theme';

const MemberLeaveButton = withProps(GroupMemberLeave, {
  label: 'group.list_leave_button',
});

const MemberRequestCancelButton = withProps(GroupMemberRequestCancel, {
  label: 'group.list_request_cancel_button',
  ariaLabel: 'group.list_request_cancel_label',
});

const MemberJoinButton = withProps(GroupMemberJoin, {
  label: 'group.list_join_button',
  ariaLabel: 'group.list_join_label',
});

const MemberRequestJoinButton = withProps(GroupMemberJoin, {
  label: 'group.list_request_join_button',
  ariaLabel: 'group.list_request_join_label',
});

const MembershipButton = ({ group }) => (
  <GroupContextProvider
    owner={group}
    groupSlug={group.slug}
    MemberJoinButton={MemberJoinButton}
    MemberRequestJoinButton={MemberRequestJoinButton}
    MemberRequestCancelButton={MemberRequestCancelButton}
    MemberLeaveButton={MemberLeaveButton}
  >
    <GroupMembershipJoinLeaveButton sx={{ width: '100%' }} />
  </GroupContextProvider>
);

const GroupList = () => {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { groups, fetching, message } = useSelector(state => state.group.list);

  useDocumentTitle(t('group.list_document_title'));

  useFetchData(fetchGroups);

  if (fetching) {
    return <PageLoader />;
  }

  if (message && message.severity === 'error') {
    return null;
  }

  const columns = [
    {
      field: 'name',
      headerName: t('group.list_column_name'),
      flex: 1.5,
      minWidth: 200,
      renderCell: ({ row: group, formattedValue }) => (
        <Link component={RouterLink} to={`/groups/${group.slug}`}>
          {formattedValue}
        </Link>
      ),
    },
    {
      field: 'email',
      headerName: t('group.list_column_contact'),
      sortable: false,
      flex: 1.5,
      minWidth: 200,
      renderCell: ({ row: group }) =>
        group.email && (
          <Link href={`mailto:${group.email}`}>{group.email}</Link>
        ),
    },
    {
      field: 'website',
      headerName: t('group.list_column_website'),
      sortable: false,
      flex: 1.5,
      minWidth: 200,
      renderCell: ({ row: group }) =>
        group.website && <Link href={group.website}>{group.website}</Link>,
    },
    {
      field: 'actions',
      type: 'actions',
      headerName: t('group.list_column_actions_description'),
      sortable: false,
      align: 'center',
      flex: 1,
      cardSize: 6,
      getActions: ({ row: group }) => [<MembershipButton group={group} />],
    },
  ];

  return (
    <PageContainer>
      <PageHeader header={t('group.list_title')} />
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
      <TableResponsive
        columns={columns}
        rows={groups}
        searchEnabled
        searchPlaceholder={t('group.list_search_placeholder')}
        searchFilterField="name"
        searchParams={Object.fromEntries(searchParams.entries())}
        onSearchParamsChange={setSearchParams}
        ariaLabel="main-heading"
        emptyMessage={
          <Trans i18nKey="group.list_empty">
            <Stack spacing={2}>
              <Typography>First</Typography>
              <Typography>
                Prefix
                <Link component={RouterLink} to={`/groups/new`}>
                  to add
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
        {t('group.create')}
      </Typography>

      <p>{t('group.list_new_description')}</p>

      <Button variant="contained" component={RouterLink} to="/groups/new">
        {t('group.list_new_button')}
      </Button>
    </PageContainer>
  );
};

export default GroupList;
