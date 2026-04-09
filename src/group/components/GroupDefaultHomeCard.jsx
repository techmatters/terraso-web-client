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

import { Trans, useTranslation } from 'react-i18next';
import { Box, Typography } from '@mui/material';

import RouterLink from 'terraso-web-client/common/components/RouterLink';
import HomeCard from 'terraso-web-client/home/components/HomeCard';

import groupsImage from 'terraso-web-client/assets/groups.png';

const GroupDefaultHomeCard = () => {
  const { t } = useTranslation();

  return (
    <HomeCard
      title={t('group.home_default_title')}
      titleId="groups-default-title"
      action={{
        label: t('group.default_connect_button'),
        to: '/groups',
      }}
      image={{
        src: groupsImage,
        to: '/groups',
      }}
    >
      <Box display="flex" alignItems="center">
        <Trans i18nKey="group.default_content">
          <Typography variant="body1" sx={{ mr: 1 }}>
            Prefix
            <RouterLink to="/groups" sx={{ textDecoration: 'underline' }}>
              Find
            </RouterLink>
            or
            <RouterLink to="/groups/new" sx={{ textDecoration: 'underline' }}>
              Start
            </RouterLink>
            .
          </Typography>
        </Trans>
      </Box>
    </HomeCard>
  );
};

export default GroupDefaultHomeCard;
