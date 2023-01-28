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

import { Alert, Box, Divider, Typography } from '@mui/material';

import CardActionRouterLink from 'common/components/CardActionRouterLink';

import HomeCard from 'home/components/HomeCard';

import theme from 'theme';

const LandscapeDefaultHomeCard = () => {
  const { t } = useTranslation();

  return (
    <HomeCard
      aria-labelledby="landscapes-default-title"
      sx={{ flexDirection: 'column' }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          padding: theme.spacing(2),
        }}
      >
        <Typography id="landscapes-default-title" variant="h2">
          {t('landscape.home_default_title')}
        </Typography>
        <Alert
          severity="info"
          sx={{
            marginTop: theme.spacing(1),
            marginBottom: theme.spacing(1),
          }}
        >
          <Typography variant="body1">
            {t('landscape.default_content')}
          </Typography>
        </Alert>
      </Box>
      <Divider aria-hidden="true" />
      <CardActionRouterLink
        label={t('landscape.default_connect_button')}
        to="/landscapes"
      />
    </HomeCard>
  );
};

export default LandscapeDefaultHomeCard;
