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

import { useCallback, useMemo } from 'react';
import _ from 'lodash/fp';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { useParams } from 'react-router';
import { useFetchData } from 'terraso-client-shared/store/utils';
import { useDispatch } from 'terraso-web-client/terrasoApi/store';

import { withProps } from 'terraso-web-client/react-hoc';

import { CollaborationContextProvider } from 'terraso-web-client/collaboration/collaborationContext';
import MembersPage from 'terraso-web-client/collaboration/components/MembersPage';
import {
  useDocumentDescription,
  useDocumentTitle,
} from 'terraso-web-client/common/document';
import PageLoader from 'terraso-web-client/layout/PageLoader';
import { useBreadcrumbsParams } from 'terraso-web-client/navigation/breadcrumbsContext';
import { usePermission } from 'terraso-web-client/permissions/index';
import { ALL_MEMBERSHIP_ROLES } from 'terraso-web-client/landscape/landscapeConstants';
import {
  changeMemberRole,
  fetchLandscapeForMembers,
  removeMember,
} from 'terraso-web-client/landscape/landscapeSlice';
import LandscapeMemberLeave from 'terraso-web-client/landscape/membership/components/LandscapeMemberLeave';
import LandscapeMemberRemove from 'terraso-web-client/landscape/membership/components/LandscapeMemberRemove';

const MemberLeaveButton = withProps(LandscapeMemberLeave, {
  label: 'landscape.members_list_leave',
});

const LandscapeMembers = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { slug } = useParams();
  const { data: landscape, fetching } = useSelector(
    state => state.landscape.members
  );

  useFetchData(useCallback(() => fetchLandscapeForMembers(slug), [slug]));

  const roles = useMemo(
    () =>
      ALL_MEMBERSHIP_ROLES.map(role => ({
        key: role,
        value: role,
        label: t(`landscape.role_${role.toLowerCase()}`),
      })),
    [t]
  );

  const onMemberRoleChange = useCallback(
    (membership, newRole) => {
      dispatch(
        changeMemberRole({
          landscapeSlug: landscape.slug,
          email: membership.user.email,
          userRole: newRole,
        })
      );
    },
    [dispatch, landscape]
  );
  const onMemberRemove = useCallback(
    membership => {
      dispatch(
        removeMember({
          landscapeSlug: landscape.slug,
          membershipId: membership.id,
          email: membership.user.email,
        })
      );
    },
    [dispatch, landscape]
  );

  const { loading: loadingPermissions, allowed: allowedToManageMembers } =
    usePermission('landscape.manageMembers', landscape);

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

  if (fetching || loadingPermissions) {
    return <PageLoader />;
  }

  return (
    <CollaborationContextProvider
      owner={landscape}
      entityType="landscape"
      onMemberRoleChange={onMemberRoleChange}
      onMemberRemove={onMemberRemove}
      MemberLeaveButton={MemberLeaveButton}
      MemberRemoveButton={LandscapeMemberRemove}
      acceptedRoles={roles}
      allowedToManageMembers={allowedToManageMembers}
    >
      <MembersPage />
    </CollaborationContextProvider>
  );
};

export default LandscapeMembers;
