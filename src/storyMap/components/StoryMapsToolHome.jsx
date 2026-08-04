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

import { useMemo, useState, useTransition } from 'react';
import _ from 'lodash/fp';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { useFetchData } from 'terraso-client-shared/store/utils';
import { Box, Button, Stack, Tab, Tabs } from '@mui/material';

import { useDocumentTitle } from 'terraso-web-client/common/document';
import PageContainer from 'terraso-web-client/layout/PageContainer';
import PageLoader from 'terraso-web-client/layout/PageLoader';
import { useBreadcrumbsParams } from 'terraso-web-client/navigation/breadcrumbsContext';
import HomeCard from 'terraso-web-client/home/components/HomeCard';
import { fetchFeaturedStoryMaps } from 'terraso-web-client/home/homeSlice';
import FeaturedStoryMapsSection from 'terraso-web-client/storyMap/components/FeaturedStoryMapsSection';
import StoryMapHomeListItem from 'terraso-web-client/storyMap/components/StoryMapHomeListItem';
import StoryMapsCard, {
  STORY_MAP_CARD_VARIANTS,
} from 'terraso-web-client/storyMap/components/StoryMapsCard';
import { fetchUserStoryMaps } from 'terraso-web-client/storyMap/storyMapSlice';

const INITIAL_VISIBLE_STORY_MAPS = 3;
const LOAD_MORE_STORY_MAPS = 10;

const STORY_MAP_FILTERS = {
  ALL: 'all',
  DRAFT: 'draft',
  PUBLISHED: 'published',
};

const getFilteredStoryMaps = (storyMaps, filter) => {
  if (filter === STORY_MAP_FILTERS.PUBLISHED) {
    return storyMaps.filter(storyMap => storyMap.isPublished);
  }

  if (filter === STORY_MAP_FILTERS.DRAFT) {
    return storyMaps.filter(storyMap => !storyMap.isPublished);
  }

  return storyMaps;
};

const StoryMapsEditorCard = ({ storyMaps }) => {
  const { t } = useTranslation();
  const [filter, setFilter] = useState(STORY_MAP_FILTERS.ALL);
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE_STORY_MAPS);
  const [isPending, startTransition] = useTransition();
  const filteredStoryMaps = useMemo(
    () => getFilteredStoryMaps(storyMaps, filter),
    [filter, storyMaps]
  );
  const visibleStoryMaps = filteredStoryMaps.slice(0, visibleCount);
  const canLoadMore = visibleStoryMaps.length < filteredStoryMaps.length;

  const handleFilterChange = (event, nextFilter) => {
    setFilter(nextFilter);
    setVisibleCount(INITIAL_VISIBLE_STORY_MAPS);
  };

  return (
    <HomeCard
      title={t('storyMap.home_my_story_maps')}
      titleId="my-story-maps-title"
      cardSx={{
        color: 'white',
        bgcolor: 'secondary.main',
        backgroundPosition: 'top center',
        backgroundSize: '100% auto',
      }}
      headingSx={{
        fontSize: '30px',
        lineHeight: '36px',
        textTransform: 'none',
      }}
      backgroundImage="/files/card-background-primary-1-longer.png"
    >
      <Stack spacing={3} sx={{ width: '100%' }}>
        <Tabs
          value={filter}
          onChange={handleFilterChange}
          aria-label={t('storyMap.home_my_story_maps')}
          sx={{
            minHeight: 32,
            '& .MuiTab-root': {
              color: 'white',
              fontSize: '14px',
              fontWeight: 400,
              minHeight: 32,
              minWidth: 0,
              px: 1.5,
            },
            '& .Mui-selected': { color: 'white' },
            '& .MuiTabs-indicator': { bgcolor: 'white' },
          }}
        >
          <Tab
            label={t('storyMap.dashboard_filter_all')}
            value={STORY_MAP_FILTERS.ALL}
          />
          <Tab
            label={t('storyMap.form_status_published')}
            value={STORY_MAP_FILTERS.PUBLISHED}
          />
          <Tab
            label={t('storyMap.form_status_draft')}
            value={STORY_MAP_FILTERS.DRAFT}
          />
        </Tabs>
        <Stack
          component="ul"
          aria-labelledby="my-story-maps-title"
          aria-busy={isPending}
          spacing={3}
          sx={{ m: 0, p: 0, width: '100%' }}
        >
          {visibleStoryMaps.map(storyMap => (
            <StoryMapHomeListItem key={storyMap.id} storyMap={storyMap} />
          ))}
        </Stack>
        {canLoadMore && (
          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            <Button
              color="secondary"
              loading={isPending}
              variant="contained"
              onClick={() => {
                startTransition(() => {
                  setVisibleCount(count => count + LOAD_MORE_STORY_MAPS);
                });
              }}
            >
              {t('storyMap.dashboard_load_more')}
            </Button>
          </Box>
        )}
      </Stack>
    </HomeCard>
  );
};

const StoryMapsToolsHome = () => {
  const { t } = useTranslation();
  const { list, fetching: fetchingStoryMaps } = useSelector(
    _.get('storyMap.userStoryMaps')
  );
  const { featuredStoryMaps } = useSelector(state => state.userHome);

  useDocumentTitle(t('storyMap.home_document_title'));
  useBreadcrumbsParams(useMemo(() => ({ loading: false }), []));
  useFetchData(fetchUserStoryMaps);
  useFetchData(fetchFeaturedStoryMaps);

  return (
    <>
      {fetchingStoryMaps && <PageLoader />}
      <PageContainer maxWidth="lg" sx={{ paddingTop: 3 }}>
        <Stack spacing={3} sx={{ width: '100%' }}>
          <StoryMapsCard
            title={t('storyMap.tool_home_title')}
            variant={STORY_MAP_CARD_VARIANTS.DASHBOARD_FEATURE}
          />
          {!fetchingStoryMaps && !_.isEmpty(list) && (
            <StoryMapsEditorCard storyMaps={list} />
          )}
        </Stack>
      </PageContainer>
      <FeaturedStoryMapsSection storyMaps={featuredStoryMaps} />
    </>
  );
};

export default StoryMapsToolsHome;
