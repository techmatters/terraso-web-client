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

import { useEffect, useRef, useState } from 'react';
import i18n from 'i18next';
import { Box, Stack, Typography } from '@mui/material';

import AudioWaveform from 'terraso-web-client/storyMap/components/AudioWaveform';
import {
  getMediaSource,
  getMediaKind as mediaKind,
  getMediaLabel as mediaLabel,
} from 'terraso-web-client/storyMap/storyMapMediaUtils';

export const MEDIA_PREVIEW_BACKGROUND =
  'color-mix(in srgb, var(--story-theme-text) 8%, var(--story-theme-background))';

export const StoryMapMediaItem = ({
  item,
  label,
  fill = false,
  objectFit = 'contain',
  imageStyle,
  draggable,
  onImageLoad,
}) => {
  const [hasError, setHasError] = useState(false);
  const style = {
    display: 'block',
    height: fill ? '100%' : undefined,
    maxHeight: fill ? 'none' : '360px',
    objectFit,
    width: '100%',
  };
  if (hasError) {
    return (
      <Typography role="alert">
        {i18n.t('storyMap.media_unavailable')}
      </Typography>
    );
  }

  if (mediaKind(item) === 'image') {
    return (
      <img
        src={getMediaSource(item)}
        alt={item.altText || label || mediaLabel(item)}
        draggable={draggable}
        onLoad={onImageLoad}
        onError={() => setHasError(true)}
        style={{
          ...style,
          ...imageStyle,
        }}
      />
    );
  }

  if (mediaKind(item) === 'audio') {
    return (
      <AudioWaveform
        key={getMediaSource(item)}
        label={mediaLabel(item)}
        onError={() => setHasError(true)}
        src={getMediaSource(item)}
      />
    );
  }

  if (mediaKind(item) === 'video') {
    return (
      <video
        aria-label={mediaLabel(item)}
        controls
        onError={() => setHasError(true)}
        src={getMediaSource(item)}
        style={style}
      />
    );
  }

  return (
    <iframe
      allowFullScreen
      aria-label={mediaLabel(item)}
      src={getMediaSource(item)}
      title={item.title || mediaLabel(item)}
      style={{
        ...style,
        height: fill ? '100%' : '300px',
      }}
    />
  );
};

export const MediaPreviewButton = ({ children, sx, ...props }) => (
  <Box
    component="button"
    type="button"
    title={props['aria-label']}
    {...props}
    sx={{
      bgcolor: 'var(--story-theme-background)',
      border: 0,
      cursor: 'zoom-in',
      display: 'block',
      overflow: 'hidden',
      p: 0,
      position: 'relative',
      width: '100%',
      '&:focus-visible': {
        outline: '3px solid',
        outlineColor: 'var(--story-theme-link)',
        outlineOffset: 3,
      },
      ...sx,
    }}
  >
    {children}
  </Box>
);

export const MediaCollectionHeader = ({
  currentIndex,
  headerAction,
  itemCount,
  presentationAction,
  showCounter = true,
}) => (
  <Stack
    aria-label={i18n.t('storyMap.media_collection_actions')}
    direction="row"
    role="toolbar"
    sx={{
      alignItems: 'center',
      containerType: 'inline-size',
      flexWrap: 'wrap',
      gap: 1,
      justifyContent: 'space-between',
      minHeight: 32,
      px: 0.5,
    }}
  >
    <Stack
      direction="row"
      spacing={1}
      useFlexGap
      sx={{ alignItems: 'center', flexWrap: 'wrap', minWidth: 0 }}
    >
      {presentationAction}
      {showCounter && itemCount > 1 && (
        <Typography variant="caption" sx={{ whiteSpace: 'nowrap' }}>
          {i18n.t('storyMap.media_count', {
            current: currentIndex + 1,
            total: itemCount,
          })}
        </Typography>
      )}
    </Stack>
    {headerAction}
  </Stack>
);

export const MediaItemActions = ({ children, presentation }) => (
  <Box
    aria-label={
      presentation === 'toolbar'
        ? i18n.t('storyMap.media_current_actions')
        : undefined
    }
    role={presentation === 'toolbar' ? 'toolbar' : undefined}
    sx={
      presentation === 'menu'
        ? { position: 'absolute', right: 4, top: 4, zIndex: 2 }
        : {
            bgcolor: 'rgba(33, 33, 33, 0.92)',
            display: 'flex',
            justifyContent: 'center',
            minHeight: 40,
          }
    }
  >
    {children}
  </Box>
);

export const usePlaybackBoundary = active => {
  const ref = useRef(null);
  useEffect(() => {
    if (!active) {
      pauseMediaPlayback(ref.current);
    }
  }, [active]);
  return ref;
};

export const pauseMediaPlayback = element =>
  element?.querySelectorAll('audio, video').forEach(media => media.pause());
