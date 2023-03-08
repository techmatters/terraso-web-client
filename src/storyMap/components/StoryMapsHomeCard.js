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
import React from 'react';

import { useTranslation } from 'react-i18next';

import {
  List as BaseList,
  Chip,
  Divider,
  Grid,
  ListItem,
  Stack,
  Typography,
} from '@mui/material';

import CardActionRouterLink from 'common/components/CardActionRouterLink';
import RouterButton from 'common/components/RouterButton';
import RouterLink from 'common/components/RouterLink';
import { formatDate } from 'localization/utils';

import HomeCard from 'home/components/HomeCard';

import { withProps } from 'react-hoc';

const List = withProps(BaseList, {
  component: withProps(Stack, {
    divider: <Divider aria-hidden="true" component="li" />,
    component: 'ul',
  }),
});

const GridListItem = withProps(Grid, { component: 'li' });

const StoryMapsHomeCard = props => {
  const { t, i18n } = useTranslation();
  const { storyMaps } = props;
  return (
    <HomeCard
      aria-labelledby="story-maps-list-title"
      sx={{
        flexDirection: 'column',
      }}
    >
      <Typography variant="h2" id="story-maps-list-title" sx={{ p: 2 }}>
        {t('storyMap.home_title')}
      </Typography>
      <List aria-labelledby="story-maps-list-title">
        {storyMaps.map(storyMap => (
          <ListItem
            key={storyMap.slug}
            component={GridListItem}
            container
            aria-labelledby={`story-map-${storyMap.slug}-link`}
          >
            <Stack
              component={Grid}
              item
              spacing={1}
              xs={6}
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
              }}
            >
              {!storyMap.isPublished && (
                <Chip
                  size="small"
                  label={t('storyMap.home_draft_label')}
                  sx={{
                    borderRadius: 0,
                    bgcolor: 'gray.dark1',
                    color: 'white',
                    textTransform: 'uppercase',
                    fontWeight: 700,
                    fontSize: '0.6rem',
                    height: 'auto',
                    pt: 0.25,
                    pb: 0.25,
                  }}
                />
              )}
              <RouterLink
                id={`story-map-${storyMap.slug}-link`}
                to={
                  storyMap.isPublished
                    ? `/tools/story-maps/${storyMap.slug}`
                    : `/tools/story-maps/${storyMap.slug}/edit`
                }
              >
                {storyMap.title}
              </RouterLink>
              <Typography
                variant="caption"
                sx={{
                  fontStyle: 'italic',
                }}
              >
                {t('storyMap.home_last_edited', {
                  date: formatDate(i18n.resolvedLanguage, storyMap.updatedAt),
                })}
              </Typography>
            </Stack>
            <Stack component={Grid} item xs={6} alignItems="flex-end">
              <RouterButton
                to={`/tools/story-maps/${storyMap.slug}/edit`}
                size="small"
                variant="outlined"
                sx={{ pr: 3, pl: 3 }}
              >
                {t('storyMap.home_edit')}
              </RouterButton>
            </Stack>
          </ListItem>
        ))}
      </List>
      <Divider aria-hidden="true" />
      <CardActionRouterLink
        label={t('storyMap.home_create')}
        to="/tools/story-maps/new"
      />
    </HomeCard>
  );
};

export default StoryMapsHomeCard;
