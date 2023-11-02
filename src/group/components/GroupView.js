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
import _ from 'lodash/fp.js';
import { useTranslation } from 'react-i18next';
import { Link as RouterLink, useNavigate, useParams } from 'react-router-dom';
import { useFetchData } from 'terraso-client-shared/store/utils.js';
import { useDispatch, useSelector } from 'terrasoApi/store.ts';
import EmailIcon from '@mui/icons-material/Email.js';
import PublicIcon from '@mui/icons-material/Public.js';
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

import { useSocialShareContext } from 'common/components/SocialShare.js';
import { useDocumentDescription, useDocumentTitle } from 'common/document.js';
import PageContainer from 'layout/PageContainer.js';
import PageHeader from 'layout/PageHeader.js';
import PageLoader from 'layout/PageLoader.js';
import { useRefreshProgressContext } from 'layout/RefreshProgressProvider.js';
import { useBreadcrumbsParams } from 'navigation/breadcrumbsContext.js';
import Restricted from 'permissions/components/Restricted.js';
import { GroupContextProvider } from 'group/groupContext.js';
import { fetchGroupView, refreshGroupView } from 'group/groupSlice.ts';
import GroupMemberJoin from 'group/membership/components/GroupMemberJoin.js';
import GroupMemberLeave from 'group/membership/components/GroupMemberLeave.js';
import GroupMemberRequestCancel from 'group/membership/components/GroupMemberRequestCancel.js';
import GroupMembershipCard from 'group/membership/components/GroupMembershipCard.js';
import GroupMembershipInfo from 'group/membership/components/GroupMembershipInfo.js';
import SharedDataCard from 'sharedData/components/SharedDataCard.js';

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
  const { group, fetching, refreshing } = useSelector(
    state => state.group.view
  );
  const { slug } = useParams();

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

  useFetchData(useCallback(() => fetchGroupView(slug), [slug]));

  const updateGroup = useCallback(() => {
    dispatch(refreshGroupView(slug));
  }, [dispatch, slug]);

  useEffect(() => {
    setRefreshing(refreshing);
  }, [refreshing, setRefreshing]);

  if (fetching) {
    return <PageLoader />;
  }

  if (!group) {
    return null;
  }

  return (
    <GroupContextProvider
      owner={group}
      baseOwnerUrl={`/groups/${group.slug}`}
      group={group}
      groupSlug={group.slug}
      MemberJoinButton={MemberJoinButton}
      MemberRequestJoinButton={MemberRequestJoinButton}
      MemberRequestCancelButton={MemberRequestCancelButton}
      MemberLeaveButton={MemberLeaveButton}
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
            <GroupMembershipCard
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
    </GroupContextProvider>
  );
};

export default GroupView;
