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
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { MenuItem, Select, Typography } from '@mui/material';

import { useVisualizationContext } from 'sharedData/visualization/visualizationContext';

const ColumnSelect = props => {
  const { t } = useTranslation();
  const { id, field, fieldState, placeholder, showSelected = false } = props;
  const { fileContext, getDataColumns } = useVisualizationContext();
  const { headers } = fileContext;

  const options = useMemo(
    () => (showSelected ? getDataColumns() : headers),
    [getDataColumns, headers, showSelected]
  );

  return (
    <Select
      displayEmpty
      value={field.value}
      onChange={field.onChange}
      labelId={`${id}-label`}
      error={Boolean(fieldState?.error)}
      sx={{
        width: '100%',
      }}
      renderValue={selected =>
        selected || (
          <Typography sx={{ color: 'gray.mid2' }}>{t(placeholder)}</Typography>
        )
      }
    >
      <MenuItem sx={{ color: 'gray.mid2' }} value="">
        {t(placeholder)}
      </MenuItem>
      {options.map((option, index) => (
        <MenuItem key={index} value={option}>
          {option}
        </MenuItem>
      ))}
    </Select>
  );
};

export default ColumnSelect;
