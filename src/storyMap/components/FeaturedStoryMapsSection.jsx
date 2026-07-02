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

import _ from 'lodash/fp';
import { useTranslation } from 'react-i18next';
import { Grid, Stack, Typography } from '@mui/material';

import StoryMapGalleryCard from 'terraso-web-client/storyMap/components/StoryMapGalleryCard';

const featuredStoryMapsHeadingSx = {
  color: 'text.primary',
  fontSize: '30px',
  fontWeight: 700,
  textTransform: 'none',
};

const FeaturedStoryMapsSection = ({ storyMaps }) => {
  const { t } = useTranslation();

  if (_.isEmpty(storyMaps)) {
    return null;
  }

  return (
    <Stack component="section" spacing={3}>
      <Typography component="h2" variant="h2" sx={featuredStoryMapsHeadingSx}>
        {t('home.featured_story_maps_title')}
      </Typography>
      <Grid container spacing={3}>
        {storyMaps.map(storyMap => (
          <Grid key={storyMap.id} size={{ xs: 12, md: 4 }}>
            <StoryMapGalleryCard storyMap={storyMap} />
          </Grid>
        ))}
      </Grid>
    </Stack>
  );
};

export default FeaturedStoryMapsSection;
