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
import { Link as RouterLink } from 'react-router-dom';

import { Link, Stack, Typography } from '@mui/material';

import HomeCard from 'home/components/HomeCard';

import theme from 'theme';

const ToolHomeCard = () => {
  const { t } = useTranslation();
  return (
    <HomeCard
      aria-labelledby="tools-title"
      sx={{
        flexDirection: 'column',
        padding: theme.spacing(2),
      }}
    >
      <Typography id="tools-title" variant="h2">
        {t('tool.home_card_title')}
      </Typography>
      <Typography
        variant="body1"
        sx={{
          marginTop: theme.spacing(2),
          marginBottom: theme.spacing(2),
        }}
      ></Typography>
      <Stack direction="row" spacing={3}>
        <Link component={RouterLink} to="/tools">
          <img
            src="/tools/kobo-small.png"
            alt={t('tool.home_card_img_alt')}
            height={64}
          />
        </Link>
        <Stack spacing={1}>
          <Link component={RouterLink} to="/tools">
            <Typography>{t('tool.home_card_kobo_title')}</Typography>
          </Link>
          {t('tool.home_card_description')}
        </Stack>
      </Stack>
    </HomeCard>
  );
};

export default ToolHomeCard;
