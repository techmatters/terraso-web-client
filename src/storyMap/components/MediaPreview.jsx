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

import { useRef, useState } from 'react';
import i18n from 'i18next';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutlined';
import { Box, Typography } from '@mui/material';

import { AudioWaveformPreview } from 'terraso-web-client/storyMap/components/AudioWaveform';
import EmbeddedVideoPreview from 'terraso-web-client/storyMap/components/EmbeddedVideoPreview';
import StoryMapMediaItem from 'terraso-web-client/storyMap/components/StoryMapMediaItem';
import {
  calculateMediaFitScale as calculateFitScale,
  calculateMediaCropStyle,
  MEDIA_ASPECT_RATIO as CAROUSEL_ASPECT_RATIO,
  getMediaSource,
  getMediaKind as mediaKind,
  getMediaLabel as mediaLabel,
} from 'terraso-web-client/storyMap/storyMapMediaUtils';
import { MEDIA_PREVIEW_BACKGROUND } from 'terraso-web-client/storyMap/storyMapThemeUtils';

const hasEmbeddedVideoPreview = item =>
  ['youtube', 'vimeo'].includes(item.source);

const CroppedImagePreview = ({
  item,
  label,
  aspectRatio = CAROUSEL_ASPECT_RATIO,
}) => {
  const [imageSize, setImageSize] = useState();
  const fitScale = imageSize && calculateFitScale(imageSize);
  const onImageLoad = ({ currentTarget: { naturalHeight, naturalWidth } }) =>
    setImageSize({ naturalHeight, naturalWidth });
  const isFit =
    !item.crop ||
    (fitScale !== undefined && Math.abs(item.crop.scale - fitScale) < 0.001);

  if (isFit) {
    return (
      <Box
        data-testid="image-fit-preview"
        sx={{
          height: '100%',
          overflow: 'hidden',
          position: 'relative',
          width: '100%',
          '&::before': {
            backgroundImage: `url(${getMediaSource(item)})`,
            backgroundPosition: 'center',
            backgroundSize: 'cover',
            content: '""',
            filter: 'blur(18px)',
            inset: -24,
            opacity: 0.55,
            position: 'absolute',
          },
        }}
      >
        <StoryMapMediaItem
          key={getMediaSource(item)}
          fill
          draggable={false}
          imageStyle={{ position: 'relative', zIndex: 1 }}
          item={item}
          label={label}
          objectFit="contain"
          onImageLoad={onImageLoad}
        />
      </Box>
    );
  }

  const cropStyle =
    imageSize?.naturalWidth && imageSize?.naturalHeight
      ? calculateMediaCropStyle(item.crop, imageSize, aspectRatio)
      : undefined;

  return (
    <Box
      data-cropped-media-preview
      sx={{ position: 'absolute', inset: 0, overflow: 'hidden' }}
    >
      <StoryMapMediaItem
        key={getMediaSource(item)}
        fill
        draggable={false}
        imageStyle={{
          position: 'absolute',
          left: 0,
          top: 0,
          maxWidth: 'none',
          ...cropStyle,
        }}
        item={item}
        label={label}
        objectFit="fill"
        onImageLoad={onImageLoad}
      />
    </Box>
  );
};

const VideoPreview = ({ item, objectFit }) => {
  const [hasError, setHasError] = useState(false);
  const videoRef = useRef(null);

  const capturePreviewFrame = () => {
    const video = videoRef.current;
    if (!video) {
      return;
    }

    video.currentTime = Math.min(0.1, video.duration || 0);
  };

  if (hasError) {
    return (
      <Box
        data-testid="gallery-video-preview-fallback"
        sx={{
          alignItems: 'center',
          bgcolor: MEDIA_PREVIEW_BACKGROUND,
          color: 'var(--story-theme-text)',
          display: 'flex',
          height: '100%',
          justifyContent: 'center',
        }}
      >
        <PlayCircleOutlineIcon fontSize="large" />
        <Typography role="alert">
          {i18n.t('storyMap.media_video_unavailable')}
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      data-testid="gallery-video-preview"
      sx={{ height: '100%', position: 'relative', width: '100%' }}
    >
      <video
        aria-label={mediaLabel(item)}
        muted
        onError={() => setHasError(true)}
        onLoadedMetadata={capturePreviewFrame}
        onSeeked={() => videoRef.current?.pause()}
        playsInline
        preload="metadata"
        ref={videoRef}
        src={getMediaSource(item)}
        style={{
          display: 'block',
          height: '100%',
          objectFit,
          width: '100%',
        }}
      />
      <PlayCircleOutlineIcon
        aria-hidden
        sx={{
          color: 'white',
          filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.65))',
          fontSize: 44,
          left: '50%',
          position: 'absolute',
          top: '50%',
          transform: 'translate(-50%, -50%)',
        }}
      />
    </Box>
  );
};

const MediaPreview = ({ item, objectFit = 'cover', aspectRatio = 4 / 3 }) => {
  if (hasEmbeddedVideoPreview(item)) {
    return <EmbeddedVideoPreview item={item} />;
  }
  if (['audio', 'embedded'].includes(mediaKind(item))) {
    return (
      <Box
        data-testid={
          mediaKind(item) === 'audio' ? 'gallery-audio-preview' : undefined
        }
        sx={{
          alignItems: 'center',
          bgcolor: MEDIA_PREVIEW_BACKGROUND,
          color: 'var(--story-theme-text)',
          display: 'flex',
          height: '100%',
          justifyContent: 'center',
        }}
      >
        {mediaKind(item) === 'audio' ? (
          <AudioWaveformPreview src={getMediaSource(item)} />
        ) : (
          <PlayCircleOutlineIcon fontSize="large" />
        )}
      </Box>
    );
  }

  if (mediaKind(item) === 'image') {
    return <CroppedImagePreview aspectRatio={aspectRatio} item={item} />;
  }

  return <VideoPreview item={item} objectFit={objectFit} />;
};

export default MediaPreview;
