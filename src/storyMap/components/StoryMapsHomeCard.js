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
import React from 'react';

import { useTranslation } from 'react-i18next';

import ModeEditIcon from '@mui/icons-material/ModeEdit';
import {
  Divider,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
} from '@mui/material';

import CardActionRouterLink from 'common/components/CardActionRouterLink';
import RouterLink from 'common/components/RouterLink';
import { formatDate } from 'localization/utils';

import HomeCard from 'home/components/HomeCard';

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
      <List
        aria-describedby="story-maps-list-title"
        sx={{
          pl: 2,
          pr: 2,
        }}
      >
        {storyMaps.map(storyMap => (
          <ListItemButton
            key={storyMap.slug}
            component={RouterLink}
            to={
              storyMap.isPublished
                ? `/story-maps/${storyMap.slug}`
                : `/story-maps/${storyMap.slug}/edit`
            }
          >
            {!storyMap.isPublished && (
              <ListItemIcon>
                <ModeEditIcon fontSize="small" />
              </ListItemIcon>
            )}
            <ListItemText
              primary={storyMap.title}
              secondary={t('storyMap.home_last_edited', {
                date: formatDate(i18n.resolvedLanguage, storyMap.createdAt),
              })}
              secondaryTypographyProps={{
                sx: {
                  fontStyle: 'italic',
                },
              }}
            />
          </ListItemButton>
        ))}
      </List>
      <Divider aria-hidden="true" />
      <CardActionRouterLink
        label={t('storyMap.home_create')}
        to="/story-maps/create"
      />
    </HomeCard>
  );
};

export default StoryMapsHomeCard;
