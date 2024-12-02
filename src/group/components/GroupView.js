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

import React, { useCallback, useEffect, useMemo } from 'react';
import _ from 'lodash/fp';
import { usePermission } from 'permissions';
import { useTranslation } from 'react-i18next';
import { Link as RouterLink, useNavigate, useParams } from 'react-router';
import { useFetchData } from 'terraso-client-shared/store/utils';
import { useDispatch, useSelector } from 'terrasoApi/store';
import EmailIcon from '@mui/icons-material/Email';
import PublicIcon from '@mui/icons-material/Public';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  Grid,
  Link,
  Stack,
  Typography,
} from '@mui/material';

import { withProps } from 'react-hoc';

import { CollaborationContextProvider } from 'collaboration/collaborationContext';
import MembershipCard from 'collaboration/components/MembershipCard';
import { useSocialShareContext } from 'common/components/SocialShare';
import { useDocumentDescription, useDocumentTitle } from 'common/document';
import PageContainer from 'layout/PageContainer';
import PageHeader from 'layout/PageHeader';
import PageLoader from 'layout/PageLoader';
import { useRefreshProgressContext } from 'layout/RefreshProgressProvider';
import { useBreadcrumbsParams } from 'navigation/breadcrumbsContext';
import Restricted from 'permissions/components/Restricted';
import {
  fetchGroupView,
  joinGroup,
  leaveGroup,
  refreshGroupView,
} from 'group/groupSlice';
import GroupMemberJoin from 'group/membership/components/GroupMemberJoin';
import GroupMemberLeave from 'group/membership/components/GroupMemberLeave';
import GroupMemberRequestCancel from 'group/membership/components/GroupMemberRequestCancel';
import GroupMembershipInfo from 'group/membership/components/GroupMembershipInfo';
import SharedDataCard from 'sharedData/components/SharedDataCard';

const MemberLeaveButton = withProps(GroupMemberLeave, {
  label: 'group.view_leave_label',
  buttonProps: {
    sx: { flexGrow: 1 },
  },
});

const MemberRequestCancelButton = withProps(GroupMemberRequestCancel, {
  label: 'group.view_request_cancel_label',
});

const MemberJoinButton = withProps(GroupMemberJoin, {
  label: 'group.view_join_label',
});

const MemberRequestJoinButton = withProps(GroupMemberJoin, {
  label: 'group.view_request_join_button',
});

const GroupCard = ({ group }) => {
  const { t } = useTranslation();
  return (
    <Card
      component="section"
      aria-labelledby="group-view-card-title"
      style={{
        width: '100%',
        display: 'flex',
        justifyContent: 'flex-start',
        flexDirection: 'column',
      }}
    >
      <CardHeader
        disableTypography
        title={
          <Typography variant="h2" id="group-view-card-title" sx={{ pt: 0 }}>
            {t('group.view_card_title', { name: group.name })}
          </Typography>
        }
      />
      <CardContent>
        <Typography variant="body2" color="text.secondary">
          {group.description}
        </Typography>
      </CardContent>
      <CardContent
        sx={{ display: 'flex', flexGrow: 1, flexDirection: 'column' }}
      >
        {group.email && (
          <Stack
            direction="row"
            alignItems="center"
            spacing={1}
            sx={{ marginBottom: 2 }}
          >
            <EmailIcon sx={{ color: 'gray.lite1' }} />
            <Link href={`mailto:${group.email}`}>{group.email}</Link>
          </Stack>
        )}
        {group.website && (
          <Stack direction="row" alignItems="center" spacing={1}>
            <PublicIcon sx={{ color: 'gray.lite1' }} />
            <Link href={group.website} underline="none" className="wrap-url">
              {group.website}
            </Link>
          </Stack>
        )}
      </CardContent>
      <CardContent>
        <Restricted permission="group.change" resource={group}>
          <Button
            variant="outlined"
            component={RouterLink}
            to={`/groups/${group.slug}/edit`}
            sx={{
              marginTop: 2,
            }}
          >
            {t('group.view_update_button')}
          </Button>
        </Restricted>
      </CardContent>
    </Card>
  );
};

const GroupView = () => {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { setRefreshing } = useRefreshProgressContext();
  const hasToken = useSelector(state => state.account.hasToken);
  const { group, fetching, refreshing } = useSelector(
    state => state.group.view
  );
  const { slug } = useParams();
  const { allowed: allowedToManageMembers } = usePermission(
    'group.manageMembers',
    group
  );

  useDocumentTitle(
    t('group.view_document_title', { name: _.get('name', group) }),
    fetching
  );

  useDocumentDescription(
    t('group.view_document_description', {
      description: _.get('description', group),
    }),
    fetching
  );

  useBreadcrumbsParams(
    useMemo(
      () => ({ groupName: group?.name, loading: !group?.name }),
      [group?.name]
    )
  );

  useSocialShareContext(
    useMemo(
      () => ({
        name: group?.name,
      }),
      [group?.name]
    )
  );

  // Ignore eslint to force reloading data after logout
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useFetchData(useCallback(() => fetchGroupView(slug), [slug, hasToken]));

  const updateGroup = useCallback(() => {
    dispatch(refreshGroupView(slug));
  }, [dispatch, slug]);

  useEffect(() => {
    setRefreshing(refreshing);
  }, [refreshing, setRefreshing]);

  const onMemberLeave = useCallback(
    membership => {
      dispatch(
        leaveGroup({
          id: membership.membershipId,
          groupSlug: slug,
        })
      );
    },
    [dispatch, slug]
  );

  const onMemberJoin = useCallback(() => {
    dispatch(
      joinGroup({
        groupSlug: slug,
      })
    );
  }, [dispatch, slug]);

  if (fetching) {
    return <PageLoader />;
  }

  if (!group) {
    return null;
  }

  return (
    <CollaborationContextProvider
      owner={group}
      entityType="group"
      baseOwnerUrl={`/groups/${group.slug}`}
      accountMembership={group.membershipInfo.accountMembership}
      membershipInfo={group.membershipInfo}
      MemberJoinButton={MemberJoinButton}
      onMemberJoin={onMemberJoin}
      MemberLeaveButton={MemberLeaveButton}
      onMemberRemove={onMemberLeave}
      MemberRequestCancelButton={MemberRequestCancelButton}
      MemberRequestJoinButton={MemberRequestJoinButton}
      updateOwner={updateGroup}
    >
      <PageContainer>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="flex-start"
          sx={{
            marginBottom: 1,
          }}
        >
          <PageHeader header={group.name} />
        </Stack>
        <Grid container spacing={4}>
          <Grid item xs={12} md={6} style={{ display: 'flex' }}>
            <GroupCard group={group} />
          </Grid>
          <Grid item xs={12} md={6} style={{ display: 'flex' }}>
            <MembershipCard
              allowedToManageMembers={allowedToManageMembers}
              onViewMembers={() => navigate(`/groups/${group.slug}/members`)}
              InfoComponent={GroupMembershipInfo}
            />
          </Grid>
          <Grid item xs={12} md={12}>
            <SharedDataCard
              onUploadClick={() => navigate(`/groups/${group.slug}/upload`)}
              onAddVisualizationClick={() =>
                navigate(`/groups/${group.slug}/map/new`)
              }
            />
          </Grid>
        </Grid>
      </PageContainer>
    </CollaborationContextProvider>
  );
};

export default GroupView;
