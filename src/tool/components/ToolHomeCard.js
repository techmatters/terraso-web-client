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

import { Box, Divider, Link, Stack, Typography } from '@mui/material';

import CardActionRouterLink from 'common/components/CardActionRouterLink';

import HomeCard from 'home/components/HomeCard';

import theme from 'theme';

const ToolHomeCard = () => {
  const { t } = useTranslation();
  const koboImage = require(`assets/${t('tools.kobo.img.src')}`);

  return (
    <HomeCard
      aria-labelledby="tools-title"
      sx={{
        flexDirection: 'column',
        padding: theme.spacing(2),
        paddingBottom: 0,
      }}
    >
      <Typography id="tools-title" variant="h2" sx={{ pt: 0 }}>
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
          <Box
            component="img"
            src={koboImage}
            alt=""
            width={t('tools.kobo.img.width')}
            height={t('tools.kobo.img.height')}
            sx={{
              width: `${t('tools.kobo.img.width')}px`,
              height: `${t('tools.kobo.img.height')}px`,
            }}
          />
        </Link>
        <Stack spacing={1}>
          <Link component={RouterLink} to="/tools">
            <Typography>{t('tool.home_card_kobo_title')}</Typography>
          </Link>
          {t('tool.home_card_description')}
        </Stack>
      </Stack>
      <Divider aria-hidden="true" />
      <CardActionRouterLink label={t('tool.home_explore_label')} to="/tools" />
    </HomeCard>
  );
};

export default ToolHomeCard;
