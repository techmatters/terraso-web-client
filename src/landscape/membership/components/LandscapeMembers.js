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
import React, { useCallback, useMemo } from 'react';

import _ from 'lodash/fp';
import { usePermission } from 'permissions';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { useFetchData } from 'terrasoApi/utils';

import { Typography } from '@mui/material';

import { useDocumentDescription, useDocumentTitle } from 'common/document';
import PageContainer from 'layout/PageContainer';
import PageHeader from 'layout/PageHeader';
import PageLoader from 'layout/PageLoader';
import { useBreadcrumbsParams } from 'navigation/breadcrumbsContext';

import { GroupContextProvider } from 'group/groupContext';
import GroupMembersList from 'group/membership/components/GroupMembersList';
import { fetchLandscapeForMembers } from 'landscape/landscapeSlice';

import { withProps } from 'react-hoc';

import LandscapeMemberLeave from './LandscapeMemberLeave';
import LandscapeMemberRemove from './LandscapeMemberRemove';

import theme from 'theme';

const MemberLeaveButton = withProps(LandscapeMemberLeave, {
  label: 'landscape.members_list_leave',
});

const Header = ({ landscape, fetching }) => {
  const { t } = useTranslation();
  const { loading: loadingPermissions, allowed } = usePermission(
    'group.manageMembers',
    landscape
  );

  useDocumentTitle(
    t('landscape.members_document_title', {
      name: _.get('name', landscape),
    }),
    fetching
  );

  useDocumentDescription(
    t('landscape.members_document_description', {
      name: _.get('name', landscape),
    }),
    fetching
  );

  useBreadcrumbsParams(
    useMemo(
      () => ({ landscapeName: landscape?.name, loading: !landscape?.name }),
      [landscape?.name]
    )
  );

  if (loadingPermissions) {
    return null;
  }

  return (
    <>
      <PageHeader
        header={t(
          allowed
            ? 'landscape.members_title_manager'
            : 'landscape.members_title_member',
          { name: _.get('name', landscape) }
        )}
      />
      <Typography
        variant="body2"
        display="block"
        sx={{
          marginBottom: theme.spacing(3),
          marginTop: theme.spacing(2),
        }}
      >
        {t(
          allowed
            ? 'landscape.members_description_manager'
            : 'landscape.members_description_member',
          { name: _.get('name', landscape) }
        )}
      </Typography>
    </>
  );
};

const LandscapeMembers = () => {
  const { slug } = useParams();
  const { data: landscape, fetching } = useSelector(
    state => state.landscape.membersLandscape
  );

  useFetchData(useCallback(() => fetchLandscapeForMembers(slug), [slug]));

  if (fetching) {
    return <PageLoader />;
  }

  return (
    <PageContainer>
      <Header landscape={landscape} fetching={fetching} />
      <GroupContextProvider
        owner={landscape}
        groupSlug={landscape.groupSlug}
        MemberLeaveButton={MemberLeaveButton}
        MemberRemoveButton={LandscapeMemberRemove}
      >
        <GroupMembersList />
      </GroupContextProvider>
    </PageContainer>
  );
};

export default LandscapeMembers;
