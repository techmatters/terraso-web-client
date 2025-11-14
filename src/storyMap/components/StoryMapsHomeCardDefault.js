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
import storyMapImage from 'assets/tools/story-maps.png';
import RouterLink from 'common/components/RouterLink';
import HomeCard from 'home/components/HomeCard';
import { Trans, useTranslation } from 'react-i18next';
import { Box, Typography } from '@mui/material';

const StoryMapsHomeCardDefault = () => {
  const { t } = useTranslation();

  return (
    <HomeCard
      title={t('storyMap.home_title')}
      titleId="story-maps-default-title"
      action={{
        label: t('storyMap.home_create'),
        to: 'tools/story-maps/new',
        pathState: { source: 'home_page' },
      }}
      image={{
        src: storyMapImage,
        to: '/tools/story-maps',
        alt: t('tools.storyMap.img.caption'),
        caption: t('tools.storyMap.img.caption'),
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', pr: 1 }}>
        <Trans i18nKey="storyMap.home_default_description">
          <Typography variant="body1">
            Prefix
            <RouterLink
              to="/tools/story-maps"
              sx={{ textDecoration: 'underline' }}
            >
              Inspired
            </RouterLink>
            .
          </Typography>
        </Trans>
      </Box>
    </HomeCard>
  );
};

export default StoryMapsHomeCardDefault;
