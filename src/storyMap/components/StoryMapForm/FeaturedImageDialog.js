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

import React, { useCallback, useEffect, useState } from 'react';
import _ from 'lodash/fp';
import { openFile } from 'media/fileUtils';
import { Trans, useTranslation } from 'react-i18next';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  Stack,
  TextField,
  Typography,
} from '@mui/material';

import DropZone from 'common/components/DropZone';

import {
  STORY_MAP_IMAGE_ACCEPTED_EXTENSIONS,
  STORY_MAP_IMAGE_ACCEPTED_TYPES,
  STORY_MAP_MEDIA_MAX_SIZE,
} from 'config';

// Style constants
const IMAGE_PREVIEW_STYLE = {
  width: '100%',
  height: 'auto',
  maxHeight: '400px',
  objectFit: 'contain',
  display: 'block',
};

const IMAGE_CONTAINER_SX = {
  position: 'relative',
  width: '100%',
};

const HOVER_OVERLAY_SX = {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
};

const DIALOG_ACTIONS_SX = {
  padding: '20px',
};

const FeaturedImageDialog = props => {
  const { t } = useTranslation();
  const {
    open,
    onClose,
    onSave,
    existingImage,
    existingDescription,
    getMediaFile,
  } = props;

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [description, setDescription] = useState('');
  const [error, setError] = useState(null);
  const [isHovering, setIsHovering] = useState(false);

  useEffect(() => {
    if (open) {
      setDescription(existingDescription || '');

      if (existingImage?.contentId) {
        const mediaUrl = getMediaFile(existingImage.contentId);
        if (mediaUrl) {
          setImagePreview(mediaUrl);
          setImageFile({ existing: true, contentId: existingImage.contentId });
        }
      } else if (existingImage?.signedUrl) {
        setImagePreview(existingImage.signedUrl);
        setImageFile({ existing: true, signedUrl: existingImage.signedUrl });
      } else {
        setImagePreview(null);
        setImageFile(null);
      }
      setError(null);
    }
  }, [open, existingImage, existingDescription, getMediaFile]);

  const onDrop = useCallback(
    acceptedFiles => {
      if (_.isEmpty(acceptedFiles)) {
        setError(
          t('storyMap.form_featured_image_invalid', {
            extensions: STORY_MAP_IMAGE_ACCEPTED_EXTENSIONS.join(', '),
          })
        );
        return;
      }

      setError(null);
      const file = acceptedFiles[0];

      openFile(file).then(content => {
        setImagePreview(content);
        setImageFile(file);
      });
    },
    [t]
  );

  const handleRemoveImage = useCallback(() => {
    setImagePreview(null);
    setImageFile(null);
  }, []);

  const handleSave = useCallback(() => {
    if (!imageFile) {
      onSave(null, null);
    } else {
      onSave(imageFile, description);
    }
    onClose();
  }, [imageFile, description, onSave, onClose]);

  const handleClose = useCallback(() => {
    setError(null);
    onClose();
  }, [onClose]);

  const handleDescriptionChange = useCallback(event => {
    setDescription(event.target.value);
  }, []);

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullWidth
      maxWidth="sm"
      slotProps={{
        paper: {
          'aria-label': t('storyMap.form_featured_image_dialog_title'),
        },
      }}
    >
      <DialogContent>
        <Stack spacing={2}>
          <Typography>
            <Trans i18nKey="storyMap.form_featured_image_dialog_description" />
          </Typography>
          {imagePreview ? (
            <Box
              sx={IMAGE_CONTAINER_SX}
              onMouseEnter={() => setIsHovering(true)}
              onMouseLeave={() => setIsHovering(false)}
            >
              <img
                src={imagePreview}
                alt={t('storyMap.form_featured_image_preview_alt')}
                style={IMAGE_PREVIEW_STYLE}
              />
              {isHovering && (
                <Box sx={HOVER_OVERLAY_SX}>
                  <Button variant="outlined" onClick={handleRemoveImage}>
                    {t('storyMap.form_featured_image_remove')}
                  </Button>
                </Box>
              )}
            </Box>
          ) : (
            <DropZone
              errors={error ? [error] : null}
              fileTypes={STORY_MAP_IMAGE_ACCEPTED_TYPES}
              fileExtensions={STORY_MAP_IMAGE_ACCEPTED_EXTENSIONS}
              maxSize={STORY_MAP_MEDIA_MAX_SIZE}
              onDrop={onDrop}
            />
          )}

          <Stack spacing={1}>
            <Typography
              variant="body2"
              component="label"
              htmlFor="featured-image-description"
            >
              {t('storyMap.form_featured_image_description_label')}
            </Typography>
            <TextField
              id="featured-image-description"
              fullWidth
              multiline
              rows={3}
              placeholder={t(
                'storyMap.form_featured_image_description_placeholder'
              )}
              value={description}
              onChange={handleDescriptionChange}
            />
          </Stack>
        </Stack>
      </DialogContent>
      <DialogActions sx={DIALOG_ACTIONS_SX}>
        <Button onClick={handleClose}>{t('common.dialog_cancel_label')}</Button>
        <Button variant="contained" onClick={handleSave}>
          {t('storyMap.form_featured_image_save')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default FeaturedImageDialog;
