/*
 * Copyright © 2026 Technology Matters
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

import { Stack, Typography } from '@mui/material';

import HomeCard from 'terraso-web-client/common/components/HomeCard';

const DASHBOARD_HERO_CARD_SX = {
  bgcolor: 'secondary.main',
  borderRadius: '16px',
  color: 'white',
};

const DASHBOARD_HERO_CONTENT_SX = {
  alignItems: 'center',
  textAlign: 'center',
};

const DASHBOARD_HERO_HEADING_SX = {
  fontSize: '42px',
  lineHeight: '49.01px',
  textTransform: 'none',
};

const DashboardHero = ({
  actions,
  description,
  title,
  titleId = 'main-heading',
}) => (
  <HomeCard
    title={title}
    titleId={titleId}
    titleComponent="h1"
    cardSx={DASHBOARD_HERO_CARD_SX}
    contentSx={DASHBOARD_HERO_CONTENT_SX}
    headingSx={DASHBOARD_HERO_HEADING_SX}
  >
    <Stack direction="column" sx={{ alignItems: 'center', width: '100%' }}>
      <Typography sx={{ color: 'inherit', maxWidth: 720, pb: 2 }}>
        {description}
      </Typography>
      {actions}
    </Stack>
  </HomeCard>
);

export default DashboardHero;
