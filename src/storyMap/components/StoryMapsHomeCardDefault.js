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

import { Box, CardHeader, Divider, Paper, Typography } from '@mui/material';
import { Stack } from '@mui/system';

import CardActionRouterLink from 'common/components/CardActionRouterLink';
import RouterLink from 'common/components/RouterLink';

import HomeCard from 'home/components/HomeCard';

import theme from 'theme';

const StoryMapsHomeCardDefault = () => {
  const { t } = useTranslation();
  const storyMapImage = require(`assets/${t(`tools.storyMap.img.src`)}`);

  return (
    <HomeCard
      aria-labelledby="story-maps-default-title"
      sx={{ flexDirection: 'column' }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          padding: theme.spacing(2),
        }}
      >
        <Typography id="story-maps-default-title" variant="h2">
          {t('storyMap.home_title')}
        </Typography>
        <Stack direction="row" alignItems="start">
          <Paper
            variant="outlined"
            component="img"
            src={storyMapImage}
            alt={t('tool.home_card_img_alt')}
            height={64}
            sx={{ mt: 2.5 }}
          />
          <CardHeader
            title={
              <RouterLink to="/tools/story-maps">
                {t('storyMap.home_tools_link')}
              </RouterLink>
            }
            subheader={t('storyMap.home_default_description')}
          />
        </Stack>
      </Box>
      <Divider aria-hidden="true" />
      <CardActionRouterLink
        label={t('storyMap.home_create')}
        to="/tools/story-maps/new"
      />
    </HomeCard>
  );
};

export default StoryMapsHomeCardDefault;
