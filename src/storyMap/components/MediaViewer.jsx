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

import i18n from 'i18next';
import CloseIcon from '@mui/icons-material/Close';
import { Box, Dialog, IconButton, Tooltip } from '@mui/material';

import StoryMapMediaItem from 'terraso-web-client/storyMap/components/StoryMapMediaItem';
import {
  getMediaSource,
  getMediaLabel as mediaLabel,
} from 'terraso-web-client/storyMap/storyMapMediaUtils';
import {
  getStoryMapThemeCssVariables,
  STORY_MAP_OVERLAY_CONTROL_SX,
} from 'terraso-web-client/storyMap/storyMapThemeUtils';

const MediaViewer = ({ item, onClose, theme }) => (
  <Dialog
    fullWidth
    maxWidth="md"
    onClose={onClose}
    open={Boolean(item)}
    slotProps={{
      paper: {
        'aria-label': item ? mediaLabel(item) : undefined,
        sx: {
          ...getStoryMapThemeCssVariables({ themeId: theme?.id }),
          bgcolor: 'var(--story-theme-background)',
          boxShadow: 'none',
          maxHeight: 'calc(100dvh - 32px)',
          overflow: 'hidden',
        },
      },
    }}
  >
    {item && (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0,
          position: 'relative',
        }}
      >
        <Box
          data-testid="gallery-media-viewer-stage"
          sx={{
            alignItems: 'center',
            bgcolor: 'var(--story-theme-background)',
            display: 'flex',
            justifyContent: 'center',
            maxHeight: 'calc(100dvh - 32px)',
            minHeight: 0,
            overflow: 'hidden',
            width: '100%',
            '& > img, & > video, & > iframe': {
              height: 'auto !important',
              maxHeight: '100% !important',
              maxWidth: '100%',
              objectFit: 'contain',
              width: '100%',
            },
            '& > iframe': { aspectRatio: '16 / 9' },
          }}
        >
          <StoryMapMediaItem
            key={getMediaSource(item)}
            item={item}
            loading="eager"
          />
        </Box>
        <Tooltip placement="left" title={i18n.t('storyMap.media_close_viewer')}>
          <IconButton
            aria-label={i18n.t('storyMap.media_close_viewer')}
            onClick={onClose}
            sx={{
              ...STORY_MAP_OVERLAY_CONTROL_SX,
              '&:hover': {
                bgcolor: 'var(--story-theme-background)',
                color: 'var(--story-theme-text)',
              },
              borderRadius: '50%',
              height: 36,
              position: 'absolute',
              right: 8,
              top: 8,
              width: 36,
              zIndex: 1,
            }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
    )}
  </Dialog>
);

export default MediaViewer;
