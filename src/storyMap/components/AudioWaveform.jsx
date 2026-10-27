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

import { createContext, useContext, useEffect, useRef, useState } from 'react';
import i18n from 'i18next';
import logger from 'terraso-client-shared/monitoring/logger';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import { Box, Typography } from '@mui/material';

import useMediaPreviewVisibility from 'terraso-web-client/storyMap/components/useMediaPreviewVisibility';

const AudioWaveformContext = createContext(null);

const formatAudioDuration = duration =>
  `${Math.floor(duration / 60)}:${String(Math.floor(duration % 60)).padStart(2, '0')}`;

const createWaveformDataCache = () => {
  const entries = new Map();
  const releaseDecoder = entry => {
    entry.decoder?.destroy();
    entry.decoder = null;
  };
  return {
    load(src, WaveSurfer) {
      const cached = entries.get(src);
      if (cached) {
        return cached.data;
      }
      // Acquisition must not depend on a mounted preview or playback element.
      const decoder = WaveSurfer.create({
        container: document.createElement('div'),
        interact: false,
      });
      const entry = { decoder };
      entry.data = decoder
        .load(src)
        .then(() => ({
          peaks: decoder.exportPeaks({ maxLength: 1024 }),
          duration: decoder.getDuration(),
        }))
        .catch(error => {
          if (entries.get(src) === entry) {
            entries.delete(src);
          }
          throw error;
        })
        .finally(() => releaseDecoder(entry));
      entries.set(src, entry);
      return entry.data;
    },
    clear() {
      entries.forEach(releaseDecoder);
      entries.clear();
    },
  };
};

const useWaveformDataCache = () => {
  const [cache] = useState(createWaveformDataCache);
  useEffect(() => () => cache.clear(), [cache]);
  return cache;
};

export const AudioWaveformProvider = ({ children }) => {
  const waveforms = useWaveformDataCache();
  return (
    <AudioWaveformContext.Provider value={waveforms}>
      {children}
    </AudioWaveformContext.Provider>
  );
};

const AudioWaveform = ({ src, label, onError, preview = false }) => {
  const audioRef = useRef(null);
  const waveformRef = useRef(null);
  const sharedWaveforms = useContext(AudioWaveformContext);
  const localWaveforms = useWaveformDataCache();
  const waveforms = sharedWaveforms ?? localWaveforms;
  const [duration, setDuration] = useState(null);
  const isReady = duration !== null;
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
        const { peaks, duration } = await waveforms.load(src, WaveSurfer);
        if (!active) {
          return;
        }
        const style = getComputedStyle(waveformRef.current);
        waveform = WaveSurfer.create({
          container: waveformRef.current,
          media: preview ? undefined : audioRef.current,
          url: preview ? '' : src,
          peaks,
          duration,
          height: preview ? 64 : 96,
          interact: !preview,
          cursorWidth: preview ? 0 : 1,
          waveColor: style.color,
          progressColor: style.getPropertyValue('--story-theme-link').trim(),
          barWidth: 2,
          barGap: 2,
        });
        waveform.on('ready', () => {
          if (active) {
            setDuration(waveform.getDuration());
          }
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
  }, [src, preview, waveforms]);

  return (
    <Box
      sx={{
        color: 'var(--story-theme-text)',
        p: 2,
        pt: preview ? 2 : 6,
        pointerEvents: preview ? 'none' : undefined,
        width: '100%',
      }}
    >
      <Box
        aria-hidden
        ref={waveformRef}
        sx={{
          display: hasWaveformError ? 'none' : 'block',
          visibility: preview && !isReady ? 'hidden' : undefined,
          height: preview && !isReady ? 0 : undefined,
        }}
      />
      {preview && (
        <Box
          sx={{
            alignItems: 'center',
            display: 'flex',
            gap: 0.5,
            justifyContent: 'center',
            mt: isReady ? 1 : 0,
          }}
        >
          <VolumeUpIcon sx={{ fontSize: 32 }} />
          {isReady && (
            <Typography
              variant="caption"
              sx={{ fontSize: 14, fontVariantNumeric: 'tabular-nums' }}
            >
              {formatAudioDuration(duration)}
            </Typography>
          )}
        </Box>
      )}
      {hasWaveformError && (
        <Typography role={preview ? 'status' : 'alert'}>
          {i18n.t(
            preview
              ? 'storyMap.media_waveform_preview_unavailable'
              : 'storyMap.media_waveform_unavailable'
          )}
        </Typography>
      )}
      {!preview && (
        <audio
          aria-label={label}
          controls
          onError={onError}
          preload="metadata"
          ref={audioRef}
          src={src}
          style={{ display: 'block', height: '54px', width: '100%' }}
        />
      )}
    </Box>
  );
};

export const AudioWaveformPreview = ({ src }) => {
  const { previewRef, shouldLoad } = useMediaPreviewVisibility();
  return (
    <Box
      ref={previewRef}
      sx={{
        alignItems: 'center',
        color: 'var(--story-theme-text)',
        display: 'flex',
        height: '100%',
        justifyContent: 'center',
        width: '100%',
      }}
    >
      {shouldLoad ? (
        <AudioWaveform key={src} preview src={src} />
      ) : (
        <VolumeUpIcon sx={{ fontSize: 32 }} />
      )}
    </Box>
  );
};

export default AudioWaveform;
