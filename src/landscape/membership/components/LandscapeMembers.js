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
import { useFetchData } from 'terraso-client-shared/store/utils';
import { useDispatch } from 'terrasoApi/store';
import { Stack, Typography } from '@mui/material';

import { withProps } from 'react-hoc';

import MembershipsList from 'collaboration/components/MembershipsList';
import RoleSelect from 'collaboration/components/RoleSelect';
import { useDocumentDescription, useDocumentTitle } from 'common/document';
import PageContainer from 'layout/PageContainer';
import PageHeader from 'layout/PageHeader';
import PageLoader from 'layout/PageLoader';
import { useBreadcrumbsParams } from 'navigation/breadcrumbsContext';
import Restricted from 'permissions/components/Restricted';
import { ALL_MEMBERSHIP_ROLES } from 'landscape/landscapeConstants';
import {
  changeMemberRole,
  fetchLandscapeForMembers,
  removeMember,
} from 'landscape/landscapeSlice';

import LandscapeMemberLeave from './LandscapeMemberLeave';
import LandscapeMemberRemove from './LandscapeMemberRemove';

const MemberLeaveButton = withProps(LandscapeMemberLeave, {
  label: 'landscape.members_list_leave',
});

const Header = ({ landscape, fetching }) => {
  const { t } = useTranslation();
  const { loading: loadingPermissions, allowed } = usePermission(
    'landscape.manageMembers',
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
          marginBottom: 3,
          marginTop: 2,
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

const RemoveButton = props => {
  const dispatch = useDispatch();
  const { landscape, member, tabIndex } = props;
  const { data: currentUser } = useSelector(state => state.account.currentUser);

  const onConfirm = useCallback(() => {
    dispatch(
      removeMember({
        landscapeSlug: landscape.slug,
        membershipId: member.id,
        email: member.email,
      })
    );
  }, [dispatch, landscape, member]);

  if (member.email === currentUser.email) {
    return (
      <MemberLeaveButton
        onConfirm={onConfirm}
        owner={landscape}
        loading={member.fetching}
        buttonProps={{ tabIndex }}
      />
    );
  }

  return (
    <Restricted permission="landscape.manageMembers" resource={landscape}>
      <LandscapeMemberRemove
        onConfirm={onConfirm}
        owner={landscape}
        member={member}
        loading={member.fetching}
        buttonProps={{ tabIndex }}
      />
    </Restricted>
  );
};
const LandscapeMembers = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { slug } = useParams();
  const { data: landscape, fetching } = useSelector(
    state => state.landscape.members
  );
  const memberships = useMemo(
    () => landscape?.membershipsInfo?.membershipsSample || [],
    [landscape]
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
    (member, newRole) => {
      dispatch(
        changeMemberRole({
          landscapeSlug: landscape.slug,
          email: member.email,
          userRole: newRole,
        })
      );
    },
    [dispatch, landscape]
  );

  if (fetching) {
    return <PageLoader />;
  }

  return (
    <PageContainer>
      <Header landscape={landscape} fetching={fetching} />
      <section aria-labelledby="members-list-title-id">
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{
            marginTop: 2,
            marginBottom: 2,
          }}
        >
          <Restricted permission="landscape.manageMembers" resource={landscape}>
            <Typography variant="h2" id="members-list-title-id">
              {t('group.members_list_title', {
                name: landscape?.name,
              })}
            </Typography>
          </Restricted>
        </Stack>
        <MembershipsList
          memberships={memberships}
          RoleComponent={withProps(RoleSelect, {
            roles,
            permission: 'landscape.manageMembers',
            resource: landscape,
            onMemberRoleChange,
          })}
          RemoveComponent={withProps(RemoveButton, {
            landscape,
          })}
        />
      </section>
    </PageContainer>
  );
};

export default LandscapeMembers;
