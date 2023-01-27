﻿/*
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
import React from 'react';

import _ from 'lodash/fp';
import { Trans, useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { Link as RouterLink, useSearchParams } from 'react-router-dom';

import { Button, Link, Stack, Typography } from '@mui/material';

import ExternalLink from 'common/components/ExternalLink';
import TableResponsive from 'common/components/TableResponsive';
import { useDocumentTitle } from 'common/document';
import { countryNameForCode } from 'common/utils';
import PageContainer from 'layout/PageContainer';
import PageHeader from 'layout/PageHeader';
import PageLoader from 'layout/PageLoader';
import { useFetchData } from 'state/utils';

import { GroupContextProvider } from 'group/groupContext';
import GroupMemberJoin from 'group/membership/components/GroupMemberJoin';
import GroupMembershipCount from 'group/membership/components/GroupMembershipCount';
import GroupMembershipJoinLeaveButton from 'group/membership/components/GroupMembershipJoinLeaveButton';
import { fetchLandscapes } from 'landscape/landscapeSlice';
import LandscapeMemberLeave from 'landscape/membership/components/LandscapeMemberLeave';

import { withProps } from 'react-hoc';

import LandscapeListMap from './LandscapeListMap';

import theme from 'theme';

const MemberLeaveButton = withProps(LandscapeMemberLeave, {
  label: 'landscape.list_leave_button',
});

const MemberJoinButton = withProps(GroupMemberJoin, {
  label: 'landscape.list_join_button',
  ariaLabel: 'landscape.list_join_label',
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
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { landscapes, fetching } = useSelector(state => state.landscape.list);

  useDocumentTitle(t('landscape.list_document_title'));

  useFetchData(fetchLandscapes);

  if (fetching) {
    return <PageLoader />;
  }

  const columns = [
    {
      field: 'name',
      headerName: t('landscape.list_column_name'),
      flex: 1.5,
      minWidth: 200,
      renderCell: params => {
        const { row: landscape, formattedValue } = params;
        return (
          <Link component={RouterLink} to={`/landscapes/${landscape.slug}`}>
            {formattedValue}
          </Link>
        );
      },
    },
    {
      field: 'location',
      headerName: t('landscape.list_column_location'),
      flex: 0.5,
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
          <Link href={landscape.website}>{landscape.website}</Link>
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
      flex: 1,
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
      <Stack
        component="section"
        aria-label={t('landscape.list_map_section_label')}
        spacing={2}
        sx={{ mb: 4 }}
      >
        <LandscapeListMap />
        <Trans i18nKey="landscape.list_map_help">
          <Typography>
            Prefix
            <Link component={RouterLink} to={`/landscapes/new`}>
              add link
            </Link>
            or
            <ExternalLink href={t('landscape.list_map_help_url')}>
              help
            </ExternalLink>
            .
          </Typography>
        </Trans>
      </Stack>
      <TableResponsive
        columns={columns}
        rows={landscapes}
        searchEnabled
        searchPlaceholder={t('landscape.list_search_placeholder')}
        searchFilterField="name"
        searchParams={Object.fromEntries(searchParams.entries())}
        onSearchParamsChange={setSearchParams}
        ariaLabel="main-heading"
        emptyMessage={
          <Trans i18nKey="landscape.list_empty">
            <Stack spacing={2}>
              <Typography>First</Typography>
              <Typography>
                Prefix
                <Link component={RouterLink} to={`/landscapes/new`}>
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
        {t('landscape.add')}
      </Typography>

      <p>{t('landscape.list_new_description')}</p>

      <Button variant="contained" component={RouterLink} to="/landscapes/new">
        {t('landscape.list_new_button')}
      </Button>
    </PageContainer>
  );
};

export default LandscapeList;
