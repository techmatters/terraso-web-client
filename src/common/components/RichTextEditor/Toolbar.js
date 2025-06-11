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
import { ButtonGroup, Divider, Stack } from '@mui/material';

const Toolbar = React.memo(props => {
  const { t } = useTranslation();
  const { groups } = props;

  return (
    <Stack
      role="toolbar"
      aria-label={t('common.rich_text_editor_toolbar_label')}
      divider={
        <Divider
          flexItem
          orientation="vertical"
          variant="middle"
          aria-hidden="true"
        />
      }
      direction="row"
      sx={{
        bgcolor: 'gray.lite2',
      }}
    >
      {groups.map((group, index) => (
        <ButtonGroup
          key={index}
          size="small"
          disableElevation
          variant="text"
          sx={{
            '& .MuiButton-root': {
              color: 'black',
            },
            '& .MuiButton-root.Mui-disabled': {
              color: 'gray.mid',
            },
            '& .MuiButtonGroup-grouped:not(:last-of-type)': {
              borderRight: 'none',
            },
          }}
        >
          {group}
        </ButtonGroup>
      ))}
    </Stack>
  );
});

export default Toolbar;
