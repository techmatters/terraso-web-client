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
import { Trans, useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { Link as RouterLink, useSearchParams } from 'react-router-dom';

import { Button, Link, Stack, Typography } from '@mui/material';
import useMediaQuery from '@mui/material/useMediaQuery';

import TableResponsive from 'common/components/TableResponsive';
import { useDocumentDescription, useDocumentTitle } from 'common/document';
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

const MembershipButton = ({ group, tabIndex }) => (
  <GroupContextProvider
    owner={group}
    groupSlug={group.slug}
    MemberJoinButton={MemberJoinButton}
    MemberRequestJoinButton={MemberRequestJoinButton}
    MemberRequestCancelButton={MemberRequestCancelButton}
    MemberLeaveButton={MemberLeaveButton}
  >
    <GroupMembershipJoinLeaveButton tabIndex={tabIndex} />
  </GroupContextProvider>
);

const GroupList = () => {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { groups, fetching, message } = useSelector(_.getOr({}, 'group.list'));
  const isSmall = useMediaQuery(theme.breakpoints.down('sm'));
  const linkStyle = useMemo(
    () =>
      isSmall
        ? {
            wordBreak: 'break-word',
          }
        : {
            textOverflow: 'ellipsis',
            overflow: 'hidden',
            whiteSpace: 'nowrap',
          },
    [isSmall]
  );

  useDocumentTitle(t('group.list_document_title'));
  useDocumentDescription(t('group.list_document_description'));

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
      flex: 2,
      minWidth: 200,
      renderCell: ({ row: group, formattedValue, tabIndex }) => (
        <Link
          component={RouterLink}
          to={`/groups/${group.slug}`}
          tabIndex={tabIndex}
        >
          {formattedValue}
        </Link>
      ),
    },
    {
      field: 'email',
      headerName: t('group.list_column_contact'),
      sortable: false,
      flex: 1.15,
      minWidth: 200,
      renderCell: ({ row: group, tabIndex }) =>
        group.email && (
          <Link
            href={`mailto:${group.email}`}
            sx={linkStyle}
            tabIndex={tabIndex}
          >
            {group.email}
          </Link>
        ),
    },
    {
      field: 'website',
      headerName: t('group.list_column_website'),
      sortable: false,
      flex: 1.15,
      minWidth: 200,
      renderCell: ({ row: group, tabIndex }) =>
        group.website && (
          <Link href={group.website} sx={linkStyle} tabIndex={tabIndex}>
            {group.website.replace(/^https?:\/\//, '')}
          </Link>
        ),
    },
    {
      field: 'actions',
      type: 'actions',
      headerName: t('group.list_column_actions_description'),
      sortable: false,
      align: 'center',
      flex: 0.7,
      cardSize: 6,
      getActions: ({ row: group, tabIndex }) => [
        <MembershipButton group={group} tabIndex={tabIndex} />,
      ],
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
