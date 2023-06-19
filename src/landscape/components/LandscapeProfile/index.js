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
import React, { useCallback, useMemo, useState } from 'react';
import _ from 'lodash/fp';
import { usePermission } from 'permissions';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { useFetchData } from 'terraso-client-shared/store/utils';
import { Grid, Stack } from '@mui/material';
import { useSocialShareContext } from 'common/components/SocialShare';
import {
  useDocumentDescription,
  useDocumentImage,
  useDocumentTitle,
} from 'common/document';
import PageContainer from 'layout/PageContainer';
import PageHeader from 'layout/PageHeader';
import PageLoader from 'layout/PageLoader';
import { useBreadcrumbsParams } from 'navigation/breadcrumbsContext';
import { GroupContextProvider } from 'group/groupContext';
import GroupMemberJoin from 'group/membership/components/GroupMemberJoin';
import {
  fetchLandscapeProfile,
  refreshLandscapeView,
} from 'landscape/landscapeSlice';
import LandscapeMemberLeave from 'landscape/membership/components/LandscapeMemberLeave';
import { withProps } from 'react-hoc';
import AffiliationCard from './AffiliationCard';
import DevelopmentStrategyCard from './DevelopmentStrategyCard';
import KeyInfoCard from './KeyInfoCard';
import ProfileCard from './ProfileCard';

const MemberLeaveButton = withProps(LandscapeMemberLeave, {
  label: 'landscape.view_leave_label',
});

const MemberJoinButton = withProps(GroupMemberJoin, {
  label: 'landscape.view_join_label',
});

const LandscapeProfile = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { landscape, fetching } = useSelector(state => state.landscape.profile);
  const { slug } = useParams();
  const { loading: loadingPermissions, allowed } = usePermission(
    'landscape.change',
    landscape
  );

  const [isEmptySections, setIsEmptySections] = useState({
    developmentStrategy: false,
    affiliation: false,
    profile: false,
  });

  const setSectionIsEmpty = useCallback((section, hasData) => {
    setIsEmptySections(current => ({
      ...current,
      [section]: hasData,
    }));
  }, []);

  useDocumentImage(_.get('profileImage', landscape), fetching);

  useDocumentTitle(
    t('landscape.profile_document_title', {
      name: _.get('name', landscape),
    }),
    fetching
  );

  useDocumentDescription(
    t('landscape.profile_document_description', {
      description: _.get('description', landscape),
    }),
    fetching
  );

  useBreadcrumbsParams(
    useMemo(
      () => ({ landscapeName: landscape?.name, loading: !landscape?.name }),
      [landscape?.name]
    )
  );

  useSocialShareContext(
    useMemo(
      () => ({
        name: landscape?.name,
      }),
      [landscape?.name]
    )
  );

  useFetchData(useCallback(() => fetchLandscapeProfile(slug), [slug]));

  const updateLandscape = useCallback(() => {
    dispatch(refreshLandscapeView(slug));
  }, [dispatch, slug]);

  if (fetching || loadingPermissions) {
    return <PageLoader />;
  }

  if (!landscape) {
    return null;
  }

  return (
    <GroupContextProvider
      owner={landscape}
      baseOwnerUrl={`/landscapes/${landscape.slug}`}
      group={landscape.defaultGroup}
      groupSlug={landscape.defaultGroup.slug}
      MemberJoinButton={MemberJoinButton}
      MemberLeaveButton={MemberLeaveButton}
      updateOwner={updateLandscape}
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
          <PageHeader
            header={landscape.name}
            typographyProps={{ sx: { marginBottom: 0 } }}
          />
        </Stack>
        <Grid container spacing={4}>
          <Grid item xs={12} md={6}>
            <Stack spacing={4} direction="column">
              <KeyInfoCard landscape={landscape} />
              {(!isEmptySections.affiliation || allowed) && (
                <AffiliationCard
                  landscape={landscape}
                  setIsEmpty={setSectionIsEmpty}
                />
              )}
            </Stack>
          </Grid>
          {(!isEmptySections.profile || allowed) && (
            <Grid
              item
              xs={12}
              md={6}
              style={{ display: 'flex', alignItems: 'flex-start' }}
            >
              <ProfileCard
                landscape={landscape}
                setIsEmpty={setSectionIsEmpty}
              />
            </Grid>
          )}
          {(!isEmptySections.developmentStrategy || allowed) && (
            <Grid item xs={12} md={12}>
              <DevelopmentStrategyCard
                landscape={landscape}
                setIsEmpty={setSectionIsEmpty}
              />
            </Grid>
          )}
        </Grid>
      </PageContainer>
    </GroupContextProvider>
  );
};

export default LandscapeProfile;
