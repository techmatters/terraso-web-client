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

import { useCallback } from 'react';
import _ from 'lodash/fp';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { useFetchData } from 'terraso-client-shared/store/utils';
import { Alert, Grid, Stack } from '@mui/material';

import LoaderCard from 'terraso-web-client/common/components/LoaderCard';
import {
  useDocumentDescription,
  useDocumentTitle,
} from 'terraso-web-client/common/document';
import PageContainer from 'terraso-web-client/layout/PageContainer';
import GroupDefaultCard from 'terraso-web-client/group/components/GroupDefaultHomeCard';
import { fetchHomeStoryMaps } from 'terraso-web-client/home/homeSlice';
import LandscapeDefaultCard from 'terraso-web-client/landscape/components/LandscapeDefaultHomeCard';
import StoryMapsCard from 'terraso-web-client/storyMap/components/StoryMapsCard';
import StoryMapsHomeCardDefault from 'terraso-web-client/storyMap/components/StoryMapsHomeCardDefault';

const HOME_STORY_MAPS_PREVIEW_LIMIT = 2;

const StoryMaps = ({ storyMaps, fetching }) => {
  const { t } = useTranslation();

  if (fetching) {
    return <LoaderCard />;
  }

  if (_.isEmpty(storyMaps)) {
    return <StoryMapsHomeCardDefault />;
  }

  return (
    <StoryMapsCard
      storyMaps={storyMaps}
      title={t('storyMap.tool_home_title')}
      maxVisibleStoryMaps={HOME_STORY_MAPS_PREVIEW_LIMIT}
    />
  );
};

const Home = () => {
  const { t } = useTranslation();

  const { data: user } = useSelector(state => state.account.currentUser);
  const { list: storyMaps } = useSelector(_.get('storyMap.userStoryMaps'));
  const home = useSelector(state => state.userHome);
  const { error, fetching } = home;

  useDocumentTitle(t('home.document_title'), false, true);
  useDocumentDescription(t('home.document_description'));

  useFetchData(useCallback(() => fetchHomeStoryMaps(user.email), [user.email]));

  if (error) {
    return <Alert severity="error">{t('home.error', { error })}</Alert>;
  }

  return (
    <PageContainer>
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          <StoryMaps storyMaps={storyMaps} fetching={fetching} />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Stack spacing={3}>
            <LandscapeDefaultCard />
            <GroupDefaultCard />
          </Stack>
        </Grid>
      </Grid>
    </PageContainer>
  );
};

export default Home;
