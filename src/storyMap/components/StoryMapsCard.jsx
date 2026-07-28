/*
 * Copyright © 2023 Technology Matters
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

import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import OpenInNewOutlinedIcon from '@mui/icons-material/OpenInNewOutlined';
import { List as BaseList, Box, Stack, Typography } from '@mui/material';

import { withProps } from 'terraso-web-client/react-hoc';

import Button from 'terraso-web-client/common/components/Button';
import RouterButton from 'terraso-web-client/common/components/RouterButton';
import HomeCard from 'terraso-web-client/home/components/HomeCard';
import StoryMapHomeListItem from 'terraso-web-client/storyMap/components/StoryMapHomeListItem';

export const STORY_MAP_CARD_VARIANTS = {
  HOME: 'home',
  HOME_EMPTY: 'home-empty',
  TOOL_HOME: 'tool-home',
};

const List = withProps(BaseList, {
  component: withProps(Stack, {
    component: 'ul',
    spacing: 3,
  }),
});

const HOME_CARD_SX = {
  minHeight: 500,
  color: 'white',
  bgcolor: 'secondary.main',
  border: 'none',
  boxShadow: 'none',
};

const HOME_HEADING_SX = {
  fontSize: '42px',
  lineHeight: '49.01px',
  textTransform: 'none',
  wordWrap: 'break-word',
};

const getCardPresentation = variant => {
  switch (variant) {
    case STORY_MAP_CARD_VARIANTS.HOME_EMPTY:
      return {
        showCreateAction: true,
        showStoryMapList: false,
        showMyStoryMapsAction: false,
      };
    case STORY_MAP_CARD_VARIANTS.TOOL_HOME:
      return {
        showCreateAction: false,
        showStoryMapList: true,
        showMyStoryMapsAction: false,
      };
    case STORY_MAP_CARD_VARIANTS.HOME:
    default:
      return {
        showCreateAction: true,
        showStoryMapList: true,
        showMyStoryMapsAction: true,
      };
  }
};

const StoryMapsCard = ({
  title,
  storyMaps = [],
  variant = STORY_MAP_CARD_VARIANTS.HOME,
  maxVisibleStoryMaps,
}) => {
  const { t } = useTranslation();
  const { showCreateAction, showStoryMapList, showMyStoryMapsAction } = useMemo(
    () => getCardPresentation(variant),
    [variant]
  );
  const visibleStoryMaps = useMemo(() => {
    if (maxVisibleStoryMaps == null) {
      return storyMaps;
    }

    return storyMaps.slice(0, maxVisibleStoryMaps);
  }, [storyMaps, maxVisibleStoryMaps]);
  const action = useMemo(() => {
    if (!showMyStoryMapsAction) {
      return null;
    }

    return {
      label: t('storyMap.home_my_story_maps'),
      to: '/tools/story-maps',
    };
  }, [t, showMyStoryMapsAction]);

  const isHomeFeatureCard = variant !== STORY_MAP_CARD_VARIANTS.TOOL_HOME;

  return (
    <HomeCard
      title={title}
      titleId="story-maps-list-title"
      action={action}
      cardSx={isHomeFeatureCard ? HOME_CARD_SX : undefined}
      headingSx={isHomeFeatureCard ? HOME_HEADING_SX : undefined}
      backgroundImage={
        isHomeFeatureCard ? '/files/card-background-primary-1.png' : undefined
      }
    >
      <Stack direction="column" sx={{ width: '100%' }}>
        <Typography sx={{ pb: 2, color: 'inherit' }}>
          {t('storyMap.home_default_description')}
        </Typography>
        {showCreateAction && (
          <Stack direction="row" spacing={2} sx={{ pb: 5 }}>
            <RouterButton
              variant="contained"
              color="secondary"
              size="medium"
              to="/tools/story-maps/new"
              state={{ source: 'home_page' }}
              endIcon={<ChevronRightIcon />}
            >
              {t('storyMap.home_create')}
            </RouterButton>
            {isHomeFeatureCard && (
              <Button
                component="a"
                href="https://terraso.org/help/"
                target="_blank"
                rel="noopener noreferrer"
                variant="text"
                color="invertedMuted"
                startIcon={<OpenInNewOutlinedIcon />}
              >
                {t('storyMap.home_tutorials')}
              </Button>
            )}
          </Stack>
        )}
        {showStoryMapList && (
          <List aria-labelledby="story-maps-list-title" sx={{ width: '100%' }}>
            {visibleStoryMaps.map(storyMap => (
              <StoryMapHomeListItem key={storyMap.id} storyMap={storyMap} />
            ))}
          </List>
        )}
      </Stack>
    </HomeCard>
  );
};

export default StoryMapsCard;
