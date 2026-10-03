/*
 * Copyright © 2025 Technology Matters
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

import { useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import CloudUploadOutlined from '@mui/icons-material/CloudUploadOutlined';
import { Box, Paper, Typography } from '@mui/material';

import {
  isMapLayerFileAccepted,
  mapLayerAcceptAttribute,
} from 'terraso-web-client/storyMap/components/StoryMapForm/MapLayers/mapLayerFileDrop';

type CompactAddControlProps = {
  onFile: (file: File) => void;
  /** Called with the rejected file (surfaced by the host, e.g. the dialog). */
  onReject?: (file: File) => void;
  disabled?: boolean;
};

/**
 * Compact drop/click target that starts the create-new-map-layer flow.
 */
export const CompactAddControl = ({
  onFile,
  onReject,
  disabled,
}: CompactAddControlProps) => {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(
    (files: FileList | null | undefined) => {
      // Multi-file drops: take the first file and ignore the rest.
      const file = files?.[0];
      if (!file) {
        return;
      }
      if (isMapLayerFileAccepted(file)) {
        onFile(file);
      } else {
        onReject?.(file);
      }
    },
    [onFile, onReject]
  );

  return (
    <Paper
      variant="outlined"
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-disabled={disabled || undefined}
      aria-label={t('storyMap.form_map_layers_add_title')}
      onClick={() => {
        if (!disabled) {
          inputRef.current?.click();
        }
      }}
      onKeyDown={event => {
        if (!disabled && (event.key === 'Enter' || event.key === ' ')) {
          event.preventDefault();
          inputRef.current?.click();
        }
      }}
      onDragOver={event => {
        event.preventDefault();
        event.stopPropagation();
      }}
      onDrop={event => {
        event.preventDefault();
        event.stopPropagation();
        if (!disabled) {
          handleFiles(event.dataTransfer?.files);
        }
      }}
      sx={theme => ({
        p: theme.spacing(1.5),
        cursor: disabled ? 'default' : 'pointer',
        borderStyle: 'dashed',
        bgcolor: 'blue.lite',
      })}
    >
      <input
        ref={inputRef}
        type="file"
        hidden
        accept={mapLayerAcceptAttribute}
        onChange={event => {
          handleFiles(event.target.files);
          event.target.value = '';
        }}
      />
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
        }}
      >
        <CloudUploadOutlined fontSize="large" />
        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
          {t('storyMap.form_map_layers_add_title')}
        </Typography>
        <Typography variant="body2">
          {t('storyMap.form_map_layers_add_drop_text')}
        </Typography>
      </Box>
    </Paper>
  );
};

export default CompactAddControl;
