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

import ModeEditIcon from '@mui/icons-material/ModeEdit';
import {
  List as BaseList,
  Divider,
  Grid,
  ListItem,
  ListItemText,
  Stack,
  Typography,
} from '@mui/material';

import CardActionRouterLink from 'common/components/CardActionRouterLink';
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
            <Grid item xs={1}>
              {!storyMap.isPublished && <ModeEditIcon fontSize="small" />}
            </Grid>
            <Grid item xs={11}>
              <ListItemText
                primary={
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
                }
                secondary={t('storyMap.home_last_edited', {
                  date: formatDate(i18n.resolvedLanguage, storyMap.updatedAt),
                })}
                secondaryTypographyProps={{
                  sx: {
                    fontStyle: 'italic',
                  },
                }}
              />
            </Grid>
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
