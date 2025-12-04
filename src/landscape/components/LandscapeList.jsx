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

import React from 'react';
import _ from 'lodash/fp';
import { Trans, useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { Link as RouterLink, useSearchParams } from 'react-router';
import { useFetchData } from 'terraso-client-shared/store/utils';
import { useDispatch } from 'terrasoApi/store';
import { Button, Card, Link, Stack, Typography } from '@mui/material';

import { withProps } from 'react-hoc';

import { CollaborationContextProvider } from 'collaboration/collaborationContext';
import MemberJoin from 'collaboration/components/MemberJoin';
import MembershipListCount from 'collaboration/components/MembershipCount';
import MembershipJoinLeaveButton from 'collaboration/components/MembershipJoinLeaveButton';
import ExternalLink from 'common/components/ExternalLink';
import TableResponsive from 'common/components/TableResponsive';
import { countryNameForCode } from 'common/countries';
import { useDocumentDescription, useDocumentTitle } from 'common/document';
import PageContainer from 'layout/PageContainer';
import PageHeader from 'layout/PageHeader';
import PageLoader from 'layout/PageLoader';
import {
  fetchLandscapes,
  joinLandscapeFromList,
  leaveLandscapeFromList,
} from 'landscape/landscapeSlice';
import LandscapeMemberLeave from 'landscape/membership/components/LandscapeMemberLeave';

import LandscapeListMap from './LandscapeListMap';

const MemberLeaveButton = withProps(LandscapeMemberLeave, {
  label: 'landscape.list_leave_button',
});

const MemberJoinButton = withProps(MemberJoin, {
  label: 'landscape.list_join_button',
  ariaLabel: 'landscape.list_join_label',
});

const MembershipButton = ({ landscape, tabIndex }) => {
  const dispatch = useDispatch();
  const onMemberLeave = membership => {
    dispatch(
      leaveLandscapeFromList({
        membershipId: membership.membershipId,
        landscapeSlug: landscape.slug,
      })
    );
  };

  const onMemberJoin = () => {
    dispatch(
      joinLandscapeFromList({
        landscapeSlug: landscape.slug,
      })
    );
  };
  return (
    <CollaborationContextProvider
      owner={landscape}
      entityType="landscape"
      accountMembership={landscape.membershipInfo.accountMembership}
      membershipInfo={landscape.membershipInfo}
      MemberJoinButton={MemberJoinButton}
      MemberLeaveButton={MemberLeaveButton}
      onMemberJoin={onMemberJoin}
      onMemberRemove={onMemberLeave}
    >
      <MembershipJoinLeaveButton tabIndex={tabIndex} />
    </CollaborationContextProvider>
  );
};

const LandscapeList = () => {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { landscapes, fetching } = useSelector(state => state.landscape.list);

  useDocumentTitle(t('landscape.list_document_title'));
  useDocumentDescription(t('landscape.list_document_description'));

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
        const { row: landscape, formattedValue, tabIndex } = params;
        return (
          <Link
            component={RouterLink}
            to={`/landscapes/${landscape.slug}`}
            tabIndex={tabIndex}
          >
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
      valueGetter: (value, row, column, apiRef) =>
        row.location && countryNameForCode(row.location)?.name,
    },
    {
      field: 'website',
      headerName: t('landscape.list_column_website'),
      sortable: false,
      flex: 1.5,
      minWidth: 200,
      renderCell: ({ row: landscape, tabIndex }) =>
        landscape.website && (
          <Link href={landscape.website} tabIndex={tabIndex}>
            {landscape.website}
          </Link>
        ),
    },
    {
      field: 'members',
      headerName: t('landscape.list_column_members'),
      align: 'center',
      valueGetter: (value, row, column, apiRef) =>
        _.getOr(0, 'membershipInfo.totalCount', row),
      renderCell: ({ row: landscape }) => (
        <MembershipListCount membershipInfo={landscape.membershipInfo} />
      ),
    },
    {
      field: 'actions',
      type: 'actions',
      headerName: t('landscape.list_column_actions_description'),
      sortable: false,
      align: 'center',
      flex: 1,
      cardFieldSizes: {
        xs: 3,
      },
      getActions: ({ row: landscape, tabIndex }) => [
        <MembershipButton landscape={landscape} tabIndex={tabIndex} />,
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
          marginBottom: 3,
          marginTop: 2,
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
            <Link component={RouterLink} to="/landscapes/new">
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
                <Link component={RouterLink} to="/landscapes/new">
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

      <Card sx={{ p: 2, mt: 4 }}>
        <Typography sx={{ pt: 0 }} variant="h2">
          {t('landscape.add')}
        </Typography>

        <Typography sx={{ mt: 2, mb: 2 }}>
          {t('landscape.list_new_description')}
        </Typography>

        <Button variant="contained" component={RouterLink} to="/landscapes/new">
          {t('landscape.list_new_button')}
        </Button>
      </Card>
    </PageContainer>
  );
};

export default LandscapeList;
