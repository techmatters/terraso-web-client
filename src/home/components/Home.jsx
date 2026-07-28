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
import { Alert, Grid, Stack, Typography } from '@mui/material';

import {
  useDocumentDescription,
  useDocumentTitle,
} from 'terraso-web-client/common/document';
import PageContainer from 'terraso-web-client/layout/PageContainer';
import GroupDefaultCard from 'terraso-web-client/group/components/GroupDefaultHomeCard';
import {
  fetchFeaturedStoryMaps,
  fetchHomeStoryMaps,
} from 'terraso-web-client/home/homeSlice';
import LandscapeDefaultCard from 'terraso-web-client/landscape/components/LandscapeDefaultHomeCard';
import FeaturedStoryMapsSection from 'terraso-web-client/storyMap/components/FeaturedStoryMapsSection';
import StoryMapsCard, {
  STORY_MAP_CARD_VARIANTS,
} from 'terraso-web-client/storyMap/components/StoryMapsCard';

const HOME_STORY_MAPS_PREVIEW_LIMIT = 2;

const StoryMaps = ({ storyMaps, fetching }) => {
  const { t } = useTranslation();

  if (fetching) {
    return <StoryMapsCard title={t('storyMap.tool_home_title')} isLoading />;
  }

  if (_.isEmpty(storyMaps)) {
    return (
      <StoryMapsCard
        title={t('storyMap.tool_home_title')}
        variant={STORY_MAP_CARD_VARIANTS.HOME_EMPTY}
      />
    );
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
  const { error, fetching, featuredStoryMaps } = home;

  useDocumentTitle(t('home.document_title'), false, true);
  useDocumentDescription(t('home.document_description'));

  useFetchData(useCallback(() => fetchHomeStoryMaps(user.email), [user.email]));
  useFetchData(fetchFeaturedStoryMaps);

  if (error) {
    return <Alert severity="error">{t('home.error', { error })}</Alert>;
  }

  return (
    <>
      <PageContainer sx={{ paddingTop: 5 }}>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 8 }}>
            <StoryMaps storyMaps={storyMaps} fetching={fetching} />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }} sx={{ display: { md: 'flex' } }}>
            <Stack
              direction={{ xs: 'column', sm: 'row', md: 'column' }}
              spacing={3}
              sx={{
                width: '100%',
                flex: { md: 1 },
                '& > *': { flex: { sm: 1 } },
              }}
            >
              <LandscapeDefaultCard />
              <GroupDefaultCard />
            </Stack>
          </Grid>
        </Grid>
      </PageContainer>
      <FeaturedStoryMapsSection storyMaps={featuredStoryMaps} />
    </>
  );
};

export default Home;
