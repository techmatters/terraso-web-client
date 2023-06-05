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

const GroupDefaultHomeCard = () => {
  const { t } = useTranslation();

  return (
    <HomeCard
      aria-labelledby="groups-default-title"
      sx={{ flexDirection: 'column' }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          padding: 2,
        }}
      >
        <Typography
          id="groups-default-title"
          variant="h2"
          sx={{ pt: 0, pb: 2 }}
        >
          {t('group.home_default_title')}
        </Typography>
        <Alert
          severity="info"
          sx={{
            marginTop: 1,
            marginBottom: 1,
          }}
        >
          <Typography variant="body1">{t('group.default_content')}</Typography>
        </Alert>
      </Box>
      <Divider aria-hidden="true" />
      <CardActionRouterLink
        label={t('group.default_connect_button')}
        to="/groups"
      />
    </HomeCard>
  );
};

export default GroupDefaultHomeCard;
