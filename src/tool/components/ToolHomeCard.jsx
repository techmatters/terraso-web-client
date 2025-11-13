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
import { Stack, Typography } from '@mui/material';

import RouterLink from 'terraso-web-client/common/components/RouterLink';
import HomeCard from 'terraso-web-client/home/components/HomeCard';

import koboImage from 'terraso-web-client/assets/tools/kobotoolbox-screenshot.png';

const ToolHomeCard = () => {
  const { t } = useTranslation();

  return (
    <HomeCard
      title={t('tool.home_card_title')}
      titleId="tools-title"
      action={{
        label: t('tool.home_explore_label'),
        to: '/tools',
      }}
      image={{
        src: koboImage,
        to: '/tools',
      }}
      contentBackgroundColor="white"
    >
      <Stack direction="column">
        <Typography variant="h3" sx={{ pt: 0, mb: 2, fontSize: '1.3rem' }}>
          <RouterLink to="/tools">{t('tool.home_card_kobo_title')}</RouterLink>
        </Typography>

        <Typography variant="body1">
          {t('tool.home_card_description')}
        </Typography>
      </Stack>
    </HomeCard>
  );
};

export default ToolHomeCard;
