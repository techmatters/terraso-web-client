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
import i18n from 'i18next';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import { Box, IconButton, Stack, Tooltip } from '@mui/material';

import { AudioWaveformProvider } from 'terraso-web-client/storyMap/components/AudioWaveform';
import {
  pauseMediaPlayback,
  usePlaybackBoundary,
} from 'terraso-web-client/storyMap/components/mediaPlayback';
import {
  MediaCollectionHeader,
  MediaItemActions,
  MediaPreviewButton,
} from 'terraso-web-client/storyMap/components/MediaPresentationControls';
import MediaPreview from 'terraso-web-client/storyMap/components/MediaPreview';
import MediaViewer from 'terraso-web-client/storyMap/components/MediaViewer';
import {
  MEDIA_ASPECT_RATIO as CAROUSEL_ASPECT_RATIO,
  getMediaKind as mediaKind,
  getMediaLabel as mediaLabel,
} from 'terraso-web-client/storyMap/storyMapMediaUtils';
import {
  getStoryMapThemeCssVariables,
  MEDIA_PREVIEW_BACKGROUND,
  STORY_MAP_CONTROL_SX,
} from 'terraso-web-client/storyMap/storyMapThemeUtils';

const ExpandableCarouselStage = ({
  item,
  testId,
  onExpand,
  objectFit = 'contain',
}) => (
  <MediaPreviewButton
    aria-label={i18n.t('storyMap.media_expand', { label: mediaLabel(item) })}
    data-testid={testId}
    onClick={onExpand}
    sx={{
      alignItems: 'center',
      aspectRatio: '16 / 9',
      bgcolor:
        mediaKind(item) === 'image'
          ? 'var(--story-theme-background)'
          : MEDIA_PREVIEW_BACKGROUND,
      display: 'flex',
      justifyContent: 'center',
      minWidth: 0,
    }}
  >
    <MediaPreview
      aspectRatio={CAROUSEL_ASPECT_RATIO}
      item={item}
      objectFit={objectFit}
    />
  </MediaPreviewButton>
);

const CarouselPresentation = ({
  active = true,
  headerAction,
  items,
  currentIndex: controlledCurrentIndex,
  onCurrentIndexChange,
  presentationAction,
  renderItemActions,
  renderItemStatus,
  sx,
  theme,
}) => {
  const mediaRef = usePlaybackBoundary(active);
  const [uncontrolledCurrentIndex, setUncontrolledCurrentIndex] = useState(0);
  const [expandedItem, setExpandedItem] = useState(null);
  useEffect(() => {
    if (!active) {
      setExpandedItem(null);
    }
  }, [active]);
  const currentIndex = Math.min(
    controlledCurrentIndex ?? uncontrolledCurrentIndex,
    items.length - 1
  );
  const currentItem = items[currentIndex];
  const setCurrentIndex = index => {
    if (onCurrentIndexChange) {
      onCurrentIndexChange(index);
      return;
    }
    setUncontrolledCurrentIndex(index);
  };

  const previous = () =>
    setCurrentIndex((currentIndex - 1 + items.length) % items.length);
  const next = () => setCurrentIndex((currentIndex + 1) % items.length);

  return (
    <AudioWaveformProvider>
      <Stack
        ref={mediaRef}
        spacing={renderItemActions ? 0.5 : 1.5}
        sx={[
          theme && getStoryMapThemeCssVariables({ themeId: theme.id }),
          { color: 'var(--story-theme-text)' },
          sx,
        ]}
      >
        {renderItemActions && (
          <MediaCollectionHeader
            currentIndex={currentIndex}
            headerAction={headerAction}
            itemCount={items.length}
            presentationAction={presentationAction}
          />
        )}
        <Stack spacing={0} sx={{ overflow: 'hidden', position: 'relative' }}>
          {renderItemActions && (
            <MediaItemActions presentation="toolbar">
              {renderItemActions(currentItem, currentIndex, 'toolbar')}
            </MediaItemActions>
          )}
          <Box sx={{ position: 'relative' }}>
            <ExpandableCarouselStage
              key={`${currentItem.id || currentItem.contentId || currentIndex}-${active}`}
              item={currentItem}
              onExpand={() => {
                pauseMediaPlayback(mediaRef.current);
                setExpandedItem(currentItem);
              }}
              testId="carousel-viewport"
            />
            {renderItemStatus && (
              <Box sx={{ bottom: 8, left: 8, position: 'absolute', zIndex: 2 }}>
                {renderItemStatus(currentItem, currentIndex)}
              </Box>
            )}
          </Box>
        </Stack>
        {items.length > 1 && (
          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            <Stack
              aria-label={i18n.t('storyMap.media_navigation')}
              direction="row"
              spacing={1}
              sx={{
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Tooltip title={i18n.t('storyMap.media_previous')}>
                <IconButton
                  aria-label={i18n.t('storyMap.media_previous')}
                  onClick={previous}
                  sx={STORY_MAP_CONTROL_SX}
                >
                  <NavigateBeforeIcon />
                </IconButton>
              </Tooltip>
              <Stack
                aria-label={i18n.t('storyMap.media_position')}
                direction="row"
                spacing={0.75}
              >
                {items.map((item, index) => (
                  <Box
                    aria-current={index === currentIndex ? 'true' : undefined}
                    aria-label={mediaLabel(item, index)}
                    component="button"
                    key={item.id || item.contentId || index}
                    onClick={() => setCurrentIndex(index)}
                    sx={{
                      bgcolor:
                        index === currentIndex
                          ? 'var(--story-theme-highlight)'
                          : 'transparent',
                      border: '1px solid',
                      borderColor: 'var(--story-theme-text)',
                      borderRadius: '50%',
                      cursor: 'pointer',
                      height: 8,
                      opacity: index === currentIndex ? 1 : 0.75,
                      p: 0,
                      width: 8,
                    }}
                  />
                ))}
              </Stack>
              <Tooltip title={i18n.t('storyMap.media_next')}>
                <IconButton
                  aria-label={i18n.t('storyMap.media_next')}
                  onClick={next}
                  sx={STORY_MAP_CONTROL_SX}
                >
                  <NavigateNextIcon />
                </IconButton>
              </Tooltip>
            </Stack>
          </Box>
        )}
        <MediaViewer
          item={active ? expandedItem : null}
          onClose={() => setExpandedItem(null)}
          theme={theme}
        />
      </Stack>
    </AudioWaveformProvider>
  );
};

export default CarouselPresentation;
