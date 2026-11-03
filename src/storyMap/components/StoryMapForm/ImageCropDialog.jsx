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

import { useState } from 'react';
import i18n from 'i18next';
import AvatarEditor from 'react-avatar-editor';
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
  MEDIA_ASPECT_RATIO as CAROUSEL_ASPECT_RATIO,
  getMediaSource,
} from 'terraso-web-client/storyMap/storyMapMediaUtils';

const DEFAULT_CROP = { position: { x: 0.5, y: 0.5 }, scale: 1 };

const ImageCropDialog = ({ image, onClose, onSave }) => {
  const { getMediaFile } = useStoryMapMediaContext();
  const [altText, setAltText] = useState(image.altText || '');
  const [crop, setCrop] = useState(image.crop);
  const [fitScale, setFitScale] = useState(image.crop?.fitScale || 1);
  const previewCrop = crop || { ...DEFAULT_CROP, scale: fitScale };
  const imageSrc = getMediaSource(image, getMediaFile);

  return (
    <Dialog
      fullWidth
      maxWidth="md"
      open
      onClose={onClose}
      slotProps={{ paper: { 'aria-label': i18n.t('storyMap.media_crop') } }}
    >
      <DialogContent>
        <Stack spacing={2} sx={{ alignItems: 'center', pt: 1 }}>
          <Box sx={{ maxWidth: '100%', overflow: 'hidden' }}>
            <img
              alt={i18n.t('storyMap.media_crop_source')}
              onLoad={({ currentTarget }) => {
                const nextFitScale = calculateFitScale(currentTarget);
                setFitScale(nextFitScale);
                setCrop(currentCrop =>
                  currentCrop
                    ? {
                        ...currentCrop,
                        scale: Math.max(currentCrop.scale, nextFitScale),
                      }
                    : currentCrop
                );
              }}
              src={imageSrc}
              style={{ display: 'none' }}
            />
            <AvatarEditor
              style={{ maxWidth: '100%', height: 'auto' }}
              image={imageSrc}
              width={640}
              height={640 / CAROUSEL_ASPECT_RATIO}
              border={20}
              color={[255, 255, 255, 0.6]}
              position={previewCrop.position}
              scale={Math.max(previewCrop.scale, fitScale)}
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
              {i18n.t('storyMap.media_zoom')}
            </Typography>
            <Slider
              aria-labelledby="carousel-crop-zoom-label"
              min={fitScale}
              max={3}
              step={0.1}
              value={previewCrop.scale}
              valueLabelDisplay="auto"
              valueLabelFormat={scale =>
                scale === fitScale
                  ? i18n.t('storyMap.media_fit_image')
                  : `${scale}x`
              }
              onChange={(event, scale) => setCrop({ ...previewCrop, scale })}
            />
          </Stack>
          <OutlinedInput
            fullWidth
            inputProps={{
              maxLength: 1000,
              'aria-label': i18n.t('storyMap.media_alt_placeholder'),
            }}
            multiline
            onChange={event => setAltText(event.target.value)}
            placeholder={i18n.t('storyMap.media_alt_placeholder')}
            rows={3}
            value={altText}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{i18n.t('storyMap.media_cancel')}</Button>
        <Button
          variant="contained"
          onClick={() => onSave(crop, altText.trim())}
        >
          {i18n.t('storyMap.media_done')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ImageCropDialog;
