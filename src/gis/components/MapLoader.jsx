/*
 * Copyright © 2023 Technology Matters
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
import { CircularProgress, Paper, Stack } from '@mui/material';

const MapLoader = props => {
  const { t } = useTranslation();
  const { height } = props;
  return (
    <Paper
      square
      component={Stack}
      justifyContent="center"
      alignItems="center"
      elevation={0}
      sx={{ width: '100%', height, bgcolor: 'gray.lite1' }}
    >
      <CircularProgress aria-label={t('common.loader_label')} />
    </Paper>
  );
};

export default MapLoader;
