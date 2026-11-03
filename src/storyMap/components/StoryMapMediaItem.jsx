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
import { Typography } from '@mui/material';

import AudioWaveform from 'terraso-web-client/storyMap/components/AudioWaveform';
import {
  getMediaSource,
  getMediaKind as mediaKind,
  getMediaLabel as mediaLabel,
} from 'terraso-web-client/storyMap/storyMapMediaUtils';

const StoryMapMediaItem = ({
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

export default StoryMapMediaItem;
