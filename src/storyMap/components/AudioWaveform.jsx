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
import logger from 'terraso-client-shared/monitoring/logger';
import { Box, Typography } from '@mui/material';

const AudioWaveform = ({ src, label, onError }) => {
  const audioRef = useRef(null);
  const waveformRef = useRef(null);
  const [hasWaveformError, setHasWaveformError] = useState(false);

  useEffect(() => {
    let active = true;
    let waveform;
    const reportError = error => {
      if (!active) {
        return;
      }
      logger.error('Error loading Story Map audio waveform', error);
      setHasWaveformError(true);
    };

    const initialize = async () => {
      try {
        const { default: WaveSurfer } = await import('wavesurfer.js');
        if (!active) {
          return;
        }
        const style = getComputedStyle(waveformRef.current);
        waveform = WaveSurfer.create({
          container: waveformRef.current,
          media: audioRef.current,
          url: src,
          height: 96,
          waveColor: style.color,
          progressColor: style.getPropertyValue('--story-theme-link').trim(),
          barWidth: 2,
          barGap: 2,
        });
        waveform.on('error', reportError);
      } catch (error) {
        reportError(error);
      }
    };
    initialize();

    return () => {
      active = false;
      waveform?.destroy();
    };
  }, [src]);

  return (
    <Box sx={{ color: 'var(--story-theme-text)', p: 2, pt: 6, width: '100%' }}>
      <Box
        aria-hidden
        ref={waveformRef}
        sx={{ display: hasWaveformError ? 'none' : 'block' }}
      />
      {hasWaveformError && (
        <Typography role="alert">
          {i18n.t('storyMap.media_waveform_unavailable')}
        </Typography>
      )}
      <audio
        aria-label={label}
        controls
        onError={onError}
        preload="metadata"
        ref={audioRef}
        src={src}
        style={{ display: 'block', height: '54px', width: '100%' }}
      />
    </Box>
  );
};

export default AudioWaveform;
