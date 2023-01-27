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

import { filesize } from 'filesize';
import _ from 'lodash/fp';
import { useDropzone } from 'react-dropzone';
import { useTranslation } from 'react-i18next';

import {
  Alert,
  Box,
  CircularProgress,
  Paper,
  Stack,
  Typography,
} from '@mui/material';

import theme from 'theme';

const CurrentFile = ({ file }) => {
  const size = filesize(file.size, { round: 0 });
  return (
    <Typography sx={{ fontWeight: 'bold' }}>
      {file.name} {size}
    </Typography>
  );
};

const DropZone = props => {
  const { t } = useTranslation();
  const {
    maxSize,
    maxFiles,
    fileExtensions,
    fileTypes,
    multiple,
    onDrop,
    onDropRejected,
    currentFile,
    errors,
    className,
    loading,
  } = props;
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    onDropRejected,
    accept: fileTypes,
    useFsAccessApi: false,
    multiple,
    maxSize,
    maxFiles,
  });

  return (
    <Stack
      className={className}
      component={Paper}
      square
      direction="column"
      alignItems="center"
      justifyContent="center"
      spacing={1}
      variant="outlined"
      sx={({ palette }) => ({
        backgroundColor: isDragActive ? palette.blue.mid : palette.blue.lite,
        border: `2px dashed ${palette.blue.dark}`,
        paddingTop: errors ? 0 : 2,
        paddingBottom: 3,
        minHeight: '125px',
        cursor: 'pointer',
      })}
      {...getRootProps({
        role: 'button',
      })}
    >
      <input {...getInputProps()} />
      {loading && <CircularProgress aria-label={t('common.loader_label')} />}
      {!loading &&
        (isDragActive ? (
          <Typography>{t('common.drop_zone_drop_message')}</Typography>
        ) : (
          <>
            {errors &&
              errors.map((error, index) => (
                <Alert
                  key={index}
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    margin: `0 0 ${theme.spacing(1)}`,
                  }}
                  severity="error"
                >
                  {error}
                </Alert>
              ))}
            <Paper
              variant="outlined"
              sx={({ spacing, palette }) => ({
                padding: `${spacing(1)} ${spacing(3)}`,
                borderColor: palette.black,
              })}
            >
              {t('common.drop_zone_select_file')}
            </Paper>
            <Box sx={{ padding: theme.spacing(2), textAlign: 'center' }}>
              <Typography
                variant="caption"
                sx={{ fontWeight: 'bold', paddingTop: 1 }}
              >
                {t('common.drop_zone_format', {
                  extensions: fileExtensions.map(ext => `*.${ext}`).join(', '),
                })}
              </Typography>
              <br />
              <Typography
                variant="caption"
                sx={{ fontWeight: 'bold' }}
                style={{ margin: 0 }}
              >
                {t('common.drop_zone_size', {
                  size: filesize(maxSize, { round: 0 }),
                })}
              </Typography>
            </Box>
            {_.isEmpty(errors) && currentFile && (
              <CurrentFile file={currentFile} />
            )}
          </>
        ))}
    </Stack>
  );
};

export default DropZone;
