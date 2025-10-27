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

import React, { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Box, Button } from '@mui/material';

import FeaturedImageDialog from './FeaturedImageDialog';
import { useStoryMapConfigContext } from './storyMapConfigContext';

// Style constants
const BUTTON_SX = {
  m: 1,
  py: 1.5,
  justifyContent: 'center',
};

const THUMBNAIL_CONTAINER_SX = {
  cursor: 'pointer',
  m: 1,
  '&:hover': {
    opacity: 0.8,
  },
};

const THUMBNAIL_IMAGE_STYLE = {
  width: '100%',
  height: 'auto',
  display: 'block',
  borderRadius: '4px',
};

const FeaturedImage = () => {
  const { t } = useTranslation();
  const { config, setConfig, addMediaFile, getMediaFile } =
    useStoryMapConfigContext();
  const [dialogOpen, setDialogOpen] = useState(false);

  const imageUrl = useMemo(() => {
    const image = config.featuredImage;
    if (!image) {
      return null;
    }
    if (image.signedUrl) {
      return image.signedUrl;
    }
    if (image.contentId) {
      return getMediaFile(image.contentId);
    }
    return null;
  }, [config.featuredImage, getMediaFile]);

  const handleOpenDialog = useCallback(() => {
    setDialogOpen(true);
  }, []);

  const handleCloseDialog = useCallback(() => {
    setDialogOpen(false);
  }, []);

  const handleSaveImage = useCallback(
    (imageFile, description) => {
      if (!imageFile) {
        setConfig(config => ({
          ...config,
          featuredImage: null,
        }));
        handleCloseDialog();
        return;
      }

      if (imageFile.existing) {
        setConfig(config => ({
          ...config,
          featuredImage: {
            ...config.featuredImage,
            description,
          },
        }));
      } else {
        const contentId = addMediaFile(
          URL.createObjectURL(imageFile),
          imageFile
        );

        setConfig(config => ({
          ...config,
          featuredImage: {
            contentId,
            description,
          },
        }));
      }

      handleCloseDialog();
    },
    [setConfig, addMediaFile, handleCloseDialog]
  );

  return (
    <>
      {!imageUrl ? (
        <Button onClick={handleOpenDialog} variant="outlined" sx={BUTTON_SX}>
          {t('storyMap.form_featured_image_button')}
        </Button>
      ) : (
        <Box onClick={handleOpenDialog} sx={THUMBNAIL_CONTAINER_SX}>
          <img
            src={imageUrl}
            alt={
              config.featuredImage?.description ||
              t('storyMap.form_featured_image_button')
            }
            style={THUMBNAIL_IMAGE_STYLE}
          />
        </Box>
      )}

      <FeaturedImageDialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        onSave={handleSaveImage}
        existingImage={config.featuredImage}
        existingDescription={config.featuredImage?.description}
        getMediaFile={getMediaFile}
      />
    </>
  );
};

export default FeaturedImage;
