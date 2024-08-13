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

import React, { useCallback } from 'react';
import _ from 'lodash/fp';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { useFetchData } from 'terraso-client-shared/store/utils';
import { Alert, Grid, Stack } from '@mui/material';

import LoaderCard from 'common/components/LoaderCard';
import { useDocumentDescription, useDocumentTitle } from 'common/document';
import PageContainer from 'layout/PageContainer';
import PageHeader from 'layout/PageHeader';
import GroupDefaultCard from 'group/components/GroupDefaultHomeCard';
import GroupsCard from 'group/components/GroupsHomeCard';
import { fetchHomeData } from 'home/homeSlice';
import LandscapeDefaultCard from 'landscape/components/LandscapeDefaultHomeCard';
import LandscapesCard from 'landscape/components/LandscapesHomeCard';
import StoryMapsCard from 'storyMap/components/StoryMapsCard';
import StoryMapsHomeCardDefault from 'storyMap/components/StoryMapsHomeCardDefault';
import ToolHomeCard from 'tool/components/ToolHomeCard';

const Landscapes = ({ landscapes, fetching }) => {
  if (fetching) {
    return <LoaderCard />;
  }

  if (_.isEmpty(landscapes)) {
    return <LandscapeDefaultCard />;
  }

  return <LandscapesCard landscapes={landscapes} />;
};

const Groups = ({ groups, fetching }) => {
  if (fetching) {
    return <LoaderCard />;
  }

  if (_.isEmpty(groups)) {
    return <GroupDefaultCard />;
  }

  return <GroupsCard groups={groups} />;
};

const StoryMaps = ({ storyMaps, fetching }) => {
  const { t } = useTranslation();

  if (fetching) {
    return <LoaderCard />;
  }

  if (_.isEmpty(storyMaps)) {
    return <StoryMapsHomeCardDefault />;
  }

  return (
    <StoryMapsCard storyMaps={storyMaps} title={t('storyMap.home_title')} />
  );
};

const Home = () => {
  const { t } = useTranslation();

  const { data: user } = useSelector(state => state.account.currentUser);
  const { list: storyMaps } = useSelector(_.get('storyMap.userStoryMaps'));
  const home = useSelector(state => state.userHome);
  const { groups, landscapes, error, fetching } = home;

  useDocumentTitle(t('home.document_title'), false, true);
  useDocumentDescription(t('home.document_description'));

  useFetchData(useCallback(() => fetchHomeData(user.email), [user.email]));

  if (error) {
    return <Alert severity="error">{t('home.error', { error })}</Alert>;
  }

  return (
    <PageContainer>
      <PageHeader
        header={
          user.firstName
            ? t('home.page_title', { name: user.firstName })
            : t('home.document_title')
        }
      />
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Stack spacing={3}>
            <Landscapes landscapes={landscapes} fetching={fetching} />
            <StoryMaps storyMaps={storyMaps} fetching={fetching} />
          </Stack>
        </Grid>
        <Grid item xs={12} md={6}>
          <Stack spacing={3}>
            <Groups groups={groups} fetching={fetching} />
            <ToolHomeCard />
          </Stack>
        </Grid>
      </Grid>
    </PageContainer>
  );
};

export default Home;
