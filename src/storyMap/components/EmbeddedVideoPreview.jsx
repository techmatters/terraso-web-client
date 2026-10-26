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

import { useEffect, useState } from 'react';
import getVideoId from 'get-video-id';
import { useTranslation } from 'react-i18next';
import logger from 'terraso-client-shared/monitoring/logger';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutlined';
import { Box, Typography } from '@mui/material';

const EmbeddedVideoPreview = ({ item }) => {
  const { t } = useTranslation();
  const { id } = getVideoId(item.url);
  const [metadata, setMetadata] = useState(null);
  const [failedThumbnail, setFailedThumbnail] = useState(null);
  const isYouTube = item.source === 'youtube';
  const videoUrl = isYouTube
    ? `https://www.youtube.com/watch?v=${id}`
    : `https://vimeo.com/${id}`;
  const metadataUrl = isYouTube
    ? `https://www.youtube.com/oembed?url=${encodeURIComponent(videoUrl)}&format=json`
    : `https://vimeo.com/api/oembed.json?url=${encodeURIComponent(videoUrl)}`;
  const title =
    (metadata?.url === videoUrl ? metadata.title : undefined) || item.title;
  const thumbnailUrl = isYouTube
    ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg`
    : metadata?.url === videoUrl
      ? metadata.thumbnailUrl
      : undefined;
  const metadataFailed = metadata?.url === videoUrl && metadata.failed;

  useEffect(() => {
    const controller = new AbortController();
    const loadMetadata = async () => {
      try {
        const response = await fetch(metadataUrl, {
          signal: controller.signal,
        });
        if (!response.ok) {
          throw new Error(
            `Embedded video metadata request failed: ${response.status}`
          );
        }
        const data = await response.json();
        if (typeof data.title !== 'string' || !data.title.trim()) {
          throw new Error('Embedded video metadata response has no title');
        }
        if (
          !isYouTube &&
          (typeof data.thumbnail_url !== 'string' ||
            !data.thumbnail_url.startsWith('https://'))
        ) {
          throw new Error('Vimeo metadata response has no HTTPS thumbnail');
        }
        if (!controller.signal.aborted) {
          setMetadata({
            url: videoUrl,
            title: data.title,
            thumbnailUrl: data.thumbnail_url,
          });
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          logger.error('Error loading embedded video preview metadata', error);
          setMetadata({ url: videoUrl, failed: true });
        }
      }
    };
    loadMetadata();
    return () => controller.abort();
  }, [videoUrl, metadataUrl, isYouTube]);

  return (
    <Box
      sx={{
        alignItems: 'center',
        color: 'var(--story-theme-text)',
        display: 'flex',
        height: '100%',
        justifyContent: 'center',
        position: 'relative',
        width: '100%',
      }}
    >
      {thumbnailUrl && failedThumbnail !== thumbnailUrl && (
        <Box
          component="img"
          alt=""
          src={thumbnailUrl}
          onError={() => setFailedThumbnail(thumbnailUrl)}
          sx={{ height: '100%', objectFit: 'cover', width: '100%' }}
        />
      )}
      <PlayCircleOutlineIcon
        sx={{
          bgcolor: 'rgba(0, 0, 0, 0.6)',
          borderRadius: '50%',
          color: 'white',
          fontSize: 48,
          position: 'absolute',
        }}
      />
      <Box
        sx={{
          bgcolor: 'rgba(0, 0, 0, 0.8)',
          bottom: 0,
          color: 'white',
          left: 0,
          p: 1,
          position: 'absolute',
          right: 0,
          textAlign: 'left',
        }}
      >
        <Typography
          variant="caption"
          sx={{
            display: '-webkit-box',
            overflow: 'hidden',
            WebkitBoxOrient: 'vertical',
            WebkitLineClamp: 2,
          }}
        >
          {title || t('storyMap.media_embedded_label')}
        </Typography>
        {(metadataFailed ||
          (thumbnailUrl && failedThumbnail === thumbnailUrl)) && (
          <Typography role="status" variant="caption" sx={{ display: 'block' }}>
            {t('storyMap.media_video_unavailable')}
          </Typography>
        )}
      </Box>
    </Box>
  );
};

export default EmbeddedVideoPreview;
