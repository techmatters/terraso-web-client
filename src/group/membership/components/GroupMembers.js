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
import { usePermission, usePermissionRedirect } from 'permissions';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';

import { Typography } from '@mui/material';

import { useDocumentTitle } from 'common/document';
import PageContainer from 'layout/PageContainer';
import PageHeader from 'layout/PageHeader';
import PageLoader from 'layout/PageLoader';
import { useBreadcrumbsParams } from 'navigation/breadcrumbsContext';
import { useFetchData } from 'state/utils';

import { GroupContextProvider } from 'group/groupContext';
import { fetchGroupForMembers } from 'group/groupSlice';
import GroupMemberLeave from 'group/membership/components/GroupMemberLeave';
import GroupMemberRemove from 'group/membership/components/GroupMemberRemove';
import GroupMembersList from 'group/membership/components/GroupMembersList';

import { withProps } from 'react-hoc';

import theme from 'theme';

const MemberLeaveButton = withProps(GroupMemberLeave, {
  label: 'group.members_list_leave',
});

const Header = props => {
  const { t } = useTranslation();
  const { group, fetching } = props;

  useDocumentTitle(
    t('group.members_document_title', {
      name: _.get('name', group),
    }),
    fetching
  );

  useBreadcrumbsParams(
    useMemo(
      () => ({ groupName: group?.name, loading: !group?.name }),
      [group?.name]
    )
  );

  const { loading: loadingPermissions, allowed } = usePermission(
    'group.manageMembers',
    group
  );

  const { loading } = usePermissionRedirect(
    'group.viewMembers',
    group,
    useMemo(() => `/groups/${group?.slug}`, [group?.slug])
  );

  if (fetching || loading || loadingPermissions) {
    return null;
  }

  return (
    <>
      <PageHeader
        header={t(
          allowed
            ? 'group.members_title_manager'
            : 'group.members_title_member',
          { name: _.get('name', group) }
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
            ? 'group.members_description_manager'
            : 'group.members_description_member',
          { name: _.get('name', group) }
        )}
      </Typography>
    </>
  );
};

const GroupMembers = () => {
  const { slug } = useParams();
  const { data: group, fetching } = useSelector(
    state => state.group.membersGroup
  );

  useFetchData(useCallback(() => fetchGroupForMembers(slug), [slug]));

  if (fetching) {
    return <PageLoader />;
  }

  return (
    <PageContainer>
      <Header group={group} fetching={fetching} />
      <GroupContextProvider
        owner={group}
        groupSlug={slug}
        group={group}
        MemberLeaveButton={MemberLeaveButton}
        MemberRemoveButton={GroupMemberRemove}
      >
        <GroupMembersList />
      </GroupContextProvider>
    </PageContainer>
  );
};

export default GroupMembers;
