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
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { Box, Typography } from '@mui/material';

import HomeCard from 'terraso-web-client/common/components/HomeCard';

const CARD_SX = {
  borderRadius: '16px',
  minHeight: { xs: 300, md: 150 },
};

const HEADING_SX = {
  color: 'text.primary',
  fontSize: '30px',
  lineHeight: '36px',
  textTransform: 'none',
  wordWrap: 'break-word',
};

const GroupDefaultHomeCard = () => {
  const { t } = useTranslation();

  return (
    <HomeCard
      title={t('group.home_default_card_title')}
      titleId="groups-default-title"
      cardSx={CARD_SX}
      headingSx={HEADING_SX}
      backgroundImage="/files/card-background-secondary-2.png"
      action={{
        label: t('group.default_connect_button'),
        to: '/groups',
        endIcon: <ChevronRightIcon />,
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <Typography variant="body1" sx={{ mr: 1 }}>
          {t('group.default_content')}
        </Typography>
      </Box>
    </HomeCard>
  );
};

export default GroupDefaultHomeCard;
