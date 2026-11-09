/*
 * Copyright © 2026 Technology Matters
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

import { useCallback, useState } from 'react';
import AvatarEditor from 'react-avatar-editor';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  OutlinedInput,
  Slider,
  Stack,
  Typography,
} from '@mui/material';

import { useStoryMapMediaContext } from 'terraso-web-client/storyMap/components/StoryMapForm/storyMapConfigContext';
import {
  calculateMediaFitScale as calculateFitScale,
  calculateMediaCropGeometry,
  MEDIA_ASPECT_RATIO as CAROUSEL_ASPECT_RATIO,
  getMediaSource,
} from 'terraso-web-client/storyMap/storyMapMediaUtils';

const DEFAULT_CROP = { position: { x: 0.5, y: 0.5 }, scale: 1 };
const CROP_WIDTH = 640;
const CROP_HEIGHT = CROP_WIDTH / CAROUSEL_ASPECT_RATIO;
const CROP_BORDER = 20;

const ImageCropDialog = ({ image, onClose, onSave }) => {
  const { getMediaFile } = useStoryMapMediaContext();
  const { t } = useTranslation();
  const [altText, setAltText] = useState(image.altText || '');
  const [crop, setCrop] = useState(image.crop);
  const [imageSize, setImageSize] = useState();
  const fitScale = imageSize
    ? calculateFitScale(imageSize)
    : image.crop?.fitScale || 1;
  const previewCrop = crop || { ...DEFAULT_CROP, scale: fitScale };
  const sourceSize = imageSize || {
    naturalWidth: CROP_WIDTH,
    naturalHeight: CROP_HEIGHT,
  };
  const geometry = calculateMediaCropGeometry(previewCrop, sourceSize);
  const canPan =
    Math.max(geometry.scaledWidth, geometry.scaledHeight) >
    1 + Number.EPSILON * 4;
  const boundCrop = (nextCrop, dimensions = sourceSize) => ({
    ...nextCrop,
    position: calculateMediaCropGeometry(nextCrop, dimensions).position,
  });
  // The library exposes no canvas ARIA props; localize its rendered DOM here.
  const localizeCropSurface = useCallback(
    surface => {
      const canvas = surface?.querySelector('canvas');
      canvas?.setAttribute('aria-label', t('storyMap.media_crop_editor_label'));
      canvas?.setAttribute(
        'aria-roledescription',
        t('storyMap.media_crop_editor_role')
      );
    },
    [t]
  );
  const imageSrc = getMediaSource(image, getMediaFile);
  const blockFixedPanning = event => {
    if (
      !canPan &&
      (event.type !== 'keydown' || event.key.startsWith('Arrow'))
    ) {
      event.preventDefault();
      event.stopPropagation();
    }
  };

  return (
    <Dialog
      fullWidth
      maxWidth="md"
      open
      onClose={onClose}
      slotProps={{ paper: { 'aria-label': t('storyMap.media_crop') } }}
    >
      <DialogContent>
        <Stack spacing={2} sx={{ alignItems: 'center', pt: 1 }}>
          <Box
            ref={localizeCropSurface}
            onMouseDownCapture={blockFixedPanning}
            onTouchStartCapture={blockFixedPanning}
            onKeyDownCapture={blockFixedPanning}
            sx={{
              alignItems: 'center',
              display: 'flex',
              height: CROP_HEIGHT + 2 * CROP_BORDER,
              justifyContent: 'center',
              maxWidth: '100%',
              overflow: 'hidden',
              width: CROP_WIDTH + 2 * CROP_BORDER,
            }}
          >
            <img
              alt={t('storyMap.media_crop_source')}
              onLoad={({ currentTarget }) => {
                const nextImageSize = {
                  naturalWidth: currentTarget.naturalWidth,
                  naturalHeight: currentTarget.naturalHeight,
                };
                const nextFitScale = calculateFitScale(nextImageSize);
                setImageSize(nextImageSize);
                setCrop(currentCrop =>
                  currentCrop
                    ? boundCrop(
                        {
                          ...currentCrop,
                          scale: Math.max(currentCrop.scale, nextFitScale),
                        },
                        nextImageSize
                      )
                    : currentCrop
                );
              }}
              src={imageSrc}
              style={{ display: 'none' }}
            />
            <AvatarEditor
              style={{
                maxWidth: '100%',
                height: 'auto',
                ...(!canPan ? { cursor: 'default' } : {}),
              }}
              image={imageSrc}
              width={CROP_WIDTH * Math.min(1, geometry.scaledWidth)}
              height={CROP_HEIGHT * Math.min(1, geometry.scaledHeight)}
              border={CROP_BORDER}
              color={[255, 255, 255, 0.6]}
              position={previewCrop.position}
              // The visible crop surface covers the image at sub-1 zoom, so
              // the library can enforce its normal bounds on both axes.
              scale={Math.max(1, previewCrop.scale)}
              onPositionChange={position =>
                setCrop({ ...previewCrop, position })
              }
            />
          </Box>
          <Stack
            direction="row"
            spacing={2}
            sx={{ alignItems: 'center', width: '100%' }}
          >
            <Typography id="carousel-crop-zoom-label">
              {t('storyMap.media_zoom')}
            </Typography>
            <Slider
              aria-labelledby="carousel-crop-zoom-label"
              min={fitScale}
              max={3}
              step={0.1}
              value={previewCrop.scale}
              valueLabelDisplay="auto"
              valueLabelFormat={scale =>
                scale === fitScale ? t('storyMap.media_fit_image') : `${scale}x`
              }
              onChange={(event, scale) =>
                setCrop(
                  boundCrop({
                    ...previewCrop,
                    position: geometry.position,
                    scale,
                  })
                )
              }
            />
          </Stack>
          <OutlinedInput
            fullWidth
            inputProps={{
              maxLength: 1000,
              'aria-label': t('storyMap.media_alt_placeholder'),
            }}
            multiline
            onChange={event => setAltText(event.target.value)}
            placeholder={t('storyMap.media_alt_placeholder')}
            rows={3}
            value={altText}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t('storyMap.media_cancel')}</Button>
        <Button
          variant="contained"
          onClick={() => onSave(crop ? boundCrop(crop) : crop, altText.trim())}
        >
          {t('storyMap.media_done')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ImageCropDialog;
