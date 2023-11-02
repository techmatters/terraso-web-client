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
import _ from 'lodash/fp.js';
import { usePermission, usePermissionRedirect } from 'permissions';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { useFetchData } from 'terraso-client-shared/store/utils.js';
import { Typography } from '@mui/material';

import { withProps } from 'react-hoc';

import { useDocumentDescription, useDocumentTitle } from 'common/document.js';
import PageContainer from 'layout/PageContainer.js';
import PageHeader from 'layout/PageHeader.js';
import PageLoader from 'layout/PageLoader.js';
import { useBreadcrumbsParams } from 'navigation/breadcrumbsContext.js';
import { GroupContextProvider } from 'group/groupContext.js';
import { fetchGroupForMembers } from 'group/groupSlice.ts';
import GroupMemberLeave from 'group/membership/components/GroupMemberLeave.js';
import GroupMemberRemove from 'group/membership/components/GroupMemberRemove.js';
import GroupMembersList from 'group/membership/components/GroupMembersList.js';

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

  useDocumentDescription(
    t('group.members_document_description', {
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
          marginBottom: 3,
          marginTop: 2,
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
