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

import { useTranslation } from 'react-i18next';
import { Box, Typography } from '@mui/material';

import HomeCard from 'terraso-web-client/home/components/HomeCard';

const LandscapeDefaultHomeCard = () => {
  const { t } = useTranslation();

  return (
    <HomeCard
      title={t('landscape.home_default_card_title')}
      titleId="landscapes-default-title"
      action={{
        label: t('landscape.default_connect_button'),
        to: '/landscapes',
      }}
      showActionAsButton
      helperText={t('landscape.home_popover')}
    >
      <Box display="flex" alignItems="center">
        <Typography variant="body1">
          {t('landscape.default_content')}
        </Typography>
      </Box>
    </HomeCard>
  );
};

export default LandscapeDefaultHomeCard;
