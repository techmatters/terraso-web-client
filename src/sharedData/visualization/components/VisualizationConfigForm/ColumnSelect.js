import React, { useMemo } from 'react';

import { useTranslation } from 'react-i18next';

import { MenuItem, Select, Typography } from '@mui/material';

import { useVisualizationContext } from 'sharedData/visualization/visualizationContext';

const ColumnSelect = props => {
  const { t } = useTranslation();
  const { id, field, placeholder, showSelected = false } = props;
  const { sheetContext, getDataColumns } = useVisualizationContext();
  const { headers } = sheetContext;

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
      sx={{
        width: '100%',
      }}
      renderValue={selected =>
        selected || (
          <Typography sx={{ color: 'gray.mid2' }}>{t(placeholder)}</Typography>
        )
      }
    >
      <MenuItem sx={{ color: 'gray.mid2' }} value={''}>
        {t(placeholder)}
      </MenuItem>
      {options.map(option => (
        <MenuItem key={option} value={option}>
          {option}
        </MenuItem>
      ))}
    </Select>
  );
};

export default ColumnSelect;
