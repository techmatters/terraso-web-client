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
import landscapeImage from 'assets/landscape.png';
import RouterLink from 'common/components/RouterLink';
import HomeCard from 'home/components/HomeCard';
import { Trans, useTranslation } from 'react-i18next';
import { Box, Typography } from '@mui/material';

const LandscapeDefaultHomeCard = () => {
  const { t } = useTranslation();

  return (
    <HomeCard
      title={t('landscape.home_title')}
      titleId="landscapes-default-title"
      action={{
        label: t('landscape.default_connect_button'),
        to: '/landscapes',
      }}
      image={{
        src: landscapeImage,
        to: '/landscapes',
      }}
      showActionAsButton
      helperText={t('landscape.home_popover')}
    >
      <Box display="flex" alignItems="center">
        <Trans i18nKey="landscape.default_content">
          <Typography variant="body1">
            Prefix
            <RouterLink to="/landscapes" sx={{ textDecoration: 'underline' }}>
              Connect
            </RouterLink>
            suffix
          </Typography>
        </Trans>
      </Box>
    </HomeCard>
  );
};

export default LandscapeDefaultHomeCard;
