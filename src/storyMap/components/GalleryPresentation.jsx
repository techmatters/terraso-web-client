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
import { Box, Stack, Typography } from '@mui/material';

import { AudioWaveformProvider } from 'terraso-web-client/storyMap/components/AudioWaveform';
import {
  MEDIA_PREVIEW_BACKGROUND,
  MediaCollectionHeader,
  MediaItemActions,
  MediaPreviewButton,
  pauseMediaPlayback,
  usePlaybackBoundary,
} from 'terraso-web-client/storyMap/components/mediaPresentationShared';
import MediaPreview from 'terraso-web-client/storyMap/components/MediaPreview';
import MediaViewer from 'terraso-web-client/storyMap/components/MediaViewer';
import {
  getMediaKind as mediaKind,
  getMediaLabel as mediaLabel,
} from 'terraso-web-client/storyMap/storyMapMediaUtils';
import { getStoryMapThemeCssVariables } from 'terraso-web-client/storyMap/storyMapThemeUtils';

const GalleryPresentation = ({
  active = true,
  currentIndex: controlledCurrentIndex,
  headerAction,
  items,
  onCurrentIndexChange,
  onItemsReorder,
  presentationAction,
  renderItemActions,
  renderItemStatus,
  sx,
  theme,
}) => {
  const mediaRef = usePlaybackBoundary(active);
  const dragPreviewRef = useRef(null);
  useEffect(() => () => dragPreviewRef.current?.remove(), []);
  const [dragSourceIndex, setDragSourceIndex] = useState(null);
  const [dropTargetIndex, setDropTargetIndex] = useState(null);
  const [uncontrolledCurrentIndex, setUncontrolledCurrentIndex] = useState(0);
  const [selectedItem, setSelectedItem] = useState(null);
  useEffect(() => {
    if (!active) {
      setSelectedItem(null);
    }
  }, [active]);
  const currentIndex = Math.min(
    controlledCurrentIndex ?? uncontrolledCurrentIndex,
    items.length - 1
  );
  const closeViewer = () => setSelectedItem(null);
  const selectItem = (item, index) => {
    pauseMediaPlayback(mediaRef.current);
    if (renderItemActions) {
      onCurrentIndexChange?.(index);
      if (!onCurrentIndexChange) {
        setUncontrolledCurrentIndex(index);
      }
    }
    setSelectedItem(item);
  };
  const clearDrag = () => {
    dragPreviewRef.current?.remove();
    dragPreviewRef.current = null;
    setDragSourceIndex(null);
    setDropTargetIndex(null);
  };
  const onDragStart = (event, index) => {
    clearDrag();
    const tile = event.currentTarget;
    const tileBounds = tile.getBoundingClientRect();
    let dragImage = tile;
    const image = tile.querySelector('[data-cropped-media-preview] img');
    if (image?.complete && image.naturalWidth) {
      const imageBounds = image.getBoundingClientRect();
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(tileBounds.width);
      canvas.height = Math.round(tileBounds.height);
      const context = canvas.getContext('2d');
      if (context) {
        // Bound the native drag bitmap; DOM snapshots can include clipped overflow.
        context.drawImage(
          image,
          imageBounds.left - tileBounds.left,
          imageBounds.top - tileBounds.top,
          imageBounds.width,
          imageBounds.height
        );
        canvas.setAttribute('aria-hidden', 'true');
        canvas.style.cssText =
          'position: fixed; top: 0; left: -10000px; pointer-events: none;';
        document.body.appendChild(canvas);
        dragPreviewRef.current = canvas;
        dragImage = canvas;
      } else {
        logger.error('Unable to create cropped media drag preview');
      }
    }
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', String(index));
    event.dataTransfer.setDragImage(
      dragImage,
      Math.round(event.clientX - tileBounds.left),
      Math.round(event.clientY - tileBounds.top)
    );
    setDragSourceIndex(index);
  };
  const onDrop = (event, destinationIndex) => {
    event.preventDefault();
    const sourceIndex = Number(event.dataTransfer.getData('text/plain'));
    if (
      onItemsReorder &&
      dragSourceIndex !== null &&
      sourceIndex === dragSourceIndex &&
      sourceIndex >= 0 &&
      sourceIndex < items.length &&
      sourceIndex !== destinationIndex
    ) {
      onItemsReorder(sourceIndex, destinationIndex);
    }
    clearDrag();
  };
  const onDragOver = (event, index) => {
    if (onItemsReorder) {
      event.preventDefault();
      event.dataTransfer.dropEffect = 'move';
      setDropTargetIndex(index);
    }
  };
  const renderItem = (item, index) => {
    const isCurrent = index === currentIndex;
    const openItem = () => selectItem(item, index);
    const dragCursor = onItemsReorder
      ? dragSourceIndex === index
        ? 'grabbing'
        : 'grab'
      : undefined;
    return (
      <Stack
        data-gallery-media-tile
        draggable={Boolean(onItemsReorder)}
        key={item.id || item.contentId || index}
        onDragEnd={clearDrag}
        onDragStart={event => onDragStart(event, index)}
        spacing={0}
        sx={{
          bgcolor: 'var(--story-theme-background)',
          cursor: dragCursor,
          minWidth: 0,
          opacity: dragSourceIndex === index ? 0.4 : 1,
          overflow: 'hidden',
          position: 'relative',
          width: '100%',
        }}
      >
        <MediaPreviewButton
          aria-label={i18n.t('storyMap.media_open', {
            label: mediaLabel(item, index),
          })}
          aria-current={renderItemActions && isCurrent ? 'true' : undefined}
          onDragEnter={event => onDragOver(event, index)}
          onDragOver={event => onDragOver(event, index)}
          onDrop={event => onDrop(event, index)}
          onClick={openItem}
          sx={{
            aspectRatio: '4 / 3',
            bgcolor:
              mediaKind(item) === 'image'
                ? 'var(--story-theme-background)'
                : MEDIA_PREVIEW_BACKGROUND,
            cursor: dragCursor || 'pointer',
            ...(onItemsReorder && {
              '&:active': { cursor: 'grabbing' },
            }),
            '&:focus-visible': {
              outline: '3px solid',
              outlineColor: 'var(--story-theme-highlight)',
              outlineOffset: 3,
            },
          }}
        >
          <MediaPreview item={item} />
        </MediaPreviewButton>
        {renderItemStatus && (
          <Box sx={{ bottom: 4, left: 4, position: 'absolute', zIndex: 2 }}>
            {renderItemStatus(item, index)}
          </Box>
        )}
        {dropTargetIndex === index && dragSourceIndex !== index && (
          <Box
            aria-label={i18n.t('storyMap.media_drop_label', {
              label: mediaLabel(item, index),
            })}
            sx={{
              alignItems: 'center',
              bgcolor: 'var(--story-theme-highlight)',
              border: '3px solid',
              borderColor: 'var(--story-theme-link)',
              color: 'var(--story-theme-highlight-text)',
              display: 'flex',
              inset: 0,
              justifyContent: 'center',
              pointerEvents: 'none',
              position: 'absolute',
              zIndex: 3,
            }}
          >
            <Typography variant="caption">
              {i18n.t('storyMap.media_drop_here')}
            </Typography>
          </Box>
        )}
        {renderItemActions && (
          <MediaItemActions presentation="menu">
            {renderItemActions(item, index, 'menu')}
          </MediaItemActions>
        )}
      </Stack>
    );
  };

  return (
    <AudioWaveformProvider>
      <Stack
        data-testid="gallery-media-collection"
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
            showCounter={false}
          />
        )}
        <Box
          data-testid="gallery-media-grid"
          sx={{
            display: 'grid',
            gap: 1,
            gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
          }}
        >
          {items.map((item, index) => renderItem(item, index))}
        </Box>
        <MediaViewer
          item={active ? selectedItem : null}
          onClose={closeViewer}
          theme={theme}
        />
      </Stack>
    </AudioWaveformProvider>
  );
};

export default GalleryPresentation;
