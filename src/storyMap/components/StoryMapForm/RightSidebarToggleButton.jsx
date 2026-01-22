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

import { forwardRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Box, IconButton } from '@mui/material';

const SIDEBAR_ICON_SRC = '/storyMap/sidebar-right-expand.svg';

const RightSidebarToggleButton = forwardRef((props, ref) => {
  const { t } = useTranslation();
  const { onClick, hidden = false, zIndex = 2 } = props;

  if (hidden) {
    return null;
  }

  return (
    <IconButton
      size="small"
      ref={ref}
      onClick={onClick}
      aria-label={t('storyMap.form_right_sidebar_open')}
      sx={theme => ({
        position: 'absolute',
        top: theme.spacing(2),
        right: theme.spacing(2),
        zIndex,
        bgcolor: 'white',
        boxShadow: '0px 2px 6px rgba(0, 0, 0, 0.2)',
        borderRadius: 2,
        border: `1px solid ${theme.palette.gray.lite1}`,
        '&:hover': {
          bgcolor: 'gray.lite1',
        },
      })}
    >
      <Box
        component="img"
        src={SIDEBAR_ICON_SRC}
        alt={t('storyMap.form_right_sidebar_open')}
        sx={{ width: 20, height: 20 }}
      />
    </IconButton>
  );
});

RightSidebarToggleButton.displayName = 'RightSidebarToggleButton';

export default RightSidebarToggleButton;
