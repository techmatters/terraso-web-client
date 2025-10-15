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
import CloudUploadOutlined from '@mui/icons-material/CloudUploadOutlined';
import {
  Alert,
  Box,
  CircularProgress,
  Paper,
  Stack,
  Typography,
} from '@mui/material';

const CurrentFile = ({ file }) => {
  const size = filesize(file.size, { round: 0 });
  return (
    <Typography sx={{ fontWeight: 'bold', wordBreak: 'break-all' }}>
      {file.name} {size}
    </Typography>
  );
};

const DropZone = props => {
  const { t } = useTranslation();
  const {
    label,
    buttonLabel,
    maxSize,
    maxFiles,
    fileExtensions,
    fileTypes,
    multiple,
    onDrop,
    onDropAccepted,
    onDropRejected,
    currentFile,
    errors,
    className,
    loading,
    containerProps,
    instructions,
    acceptedFormats,
  } = props;
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    onDropAccepted,
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
      {...containerProps}
      sx={theme => ({
        bgcolor: isDragActive ? 'blue.mid' : 'blue.lite',
        border: `2px dashed ${theme.palette.blue.dark}`,
        pt: errors ? 0 : 2,
        pb: 3,
        pl: 1,
        pr: 1,
        minHeight: '125px',
        cursor: 'pointer',
        ...(containerProps?.sx ? containerProps.sx : {}),
      })}
      {...getRootProps({
        role: 'button',
      })}
    >
      <input {...getInputProps()} />
      {label}
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
                  sx={({ spacing }) => ({
                    width: '100%',
                    boxSizing: 'border-box',
                    margin: spacing(0, 0, 1),
                  })}
                  severity="error"
                >
                  {error}
                </Alert>
              ))}
            {instructions && (
              <>
                <CloudUploadOutlined fontSize="large" />
                <Typography>{instructions}</Typography>
              </>
            )}
            <Paper
              variant="outlined"
              sx={({ spacing, palette }) => ({
                padding: spacing(1, 3),
                borderColor: palette.black,
              })}
            >
              {buttonLabel ?? t('common.drop_zone_select_file')}
            </Paper>
            <Box sx={{ padding: 2, textAlign: 'center' }}>
              <Typography
                variant="caption"
                sx={{ fontWeight: 'bold', paddingTop: 1 }}
              >
                {acceptedFormats ??
                  t('common.drop_zone_format', {
                    extensions: fileExtensions.map(ext => `.${ext}`).join(', '),
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
