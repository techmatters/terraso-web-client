/*
 * Copyright © 2026 Technology Matters
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
import { useTranslation } from 'react-i18next';
import { Box, Button, Card, Stack, Tab, Tabs, Typography } from '@mui/material';

import StoryMapHomeListItem from 'terraso-web-client/storyMap/components/StoryMapHomeListItem';

const INITIAL_VISIBLE_STORY_MAPS = 3;
const LOAD_MORE_STORY_MAPS = 10;
const EDITOR_CARD_BACKGROUND_IMAGE =
  '/files/card-background-primary-1-longer.png';
const EDITOR_CARD_ARTWORK_HEIGHT_PER_WIDTH = 0.704;

const STORY_MAP_FILTERS = {
  ALL: 'all',
  DRAFT: 'draft',
  PUBLISHED: 'published',
};

const EDITOR_CARD_SX = {
  color: 'white',
  bgcolor: 'secondary.main',
  border: 'none',
  borderRadius: '16px',
  boxShadow: 'none',
  containerType: 'inline-size',
  isolation: 'isolate',
  overflow: 'hidden',
  position: 'relative',
  '&::before': {
    content: '""',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: `min(100%, ${EDITOR_CARD_ARTWORK_HEIGHT_PER_WIDTH * 100}cqw)`,
    zIndex: 0,
    backgroundImage: `url(${EDITOR_CARD_BACKGROUND_IMAGE})`,
    backgroundPositionX: 'center',
    backgroundRepeat: 'no-repeat',
    backgroundSize: '100% auto',
  },
};

const EDITOR_CARD_CONTENT_SX = {
  p: { xs: 3, md: 4 },
  height: '100%',
  position: 'relative',
  zIndex: 1,
};

const EDITOR_CARD_HEADING_SX = {
  pt: 0,
  pb: 2,
  color: 'inherit',
  fontSize: '30px',
  lineHeight: '36px',
};

const FILTER_TABS_SX = {
  minHeight: 32,
  '& .MuiTab-root': {
    color: 'white',
    fontSize: '14px',
    fontWeight: 400,
    minHeight: 32,
    minWidth: 0,
    px: 1.5,
  },
  '& .MuiTab-root.Mui-selected': { color: 'white' },
  '& .MuiTabs-indicator': { bgcolor: 'white' },
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
    <Card
      component="section"
      aria-labelledby="my-story-maps-title"
      sx={EDITOR_CARD_SX}
    >
      <Stack direction="column" sx={EDITOR_CARD_CONTENT_SX}>
        <Typography
          id="my-story-maps-title"
          component="h2"
          variant="h2"
          sx={EDITOR_CARD_HEADING_SX}
        >
          {t('storyMap.home_my_story_maps')}
        </Typography>
        <Stack spacing={3} sx={{ width: '100%' }}>
          <Tabs
            value={filter}
            onChange={handleFilterChange}
            aria-label={t('storyMap.home_my_story_maps')}
            sx={FILTER_TABS_SX}
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
      </Stack>
    </Card>
  );
};

export default StoryMapsEditorCard;
