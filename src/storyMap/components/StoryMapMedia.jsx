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
import CloseIcon from '@mui/icons-material/Close';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutlined';
import {
  Box,
  Dialog,
  IconButton,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';

import AudioWaveform, {
  AudioWaveformPreview,
  AudioWaveformProvider,
} from 'terraso-web-client/storyMap/components/AudioWaveform';
import EmbeddedVideoPreview from 'terraso-web-client/storyMap/components/EmbeddedVideoPreview';
import {
  calculateMediaFitScale as calculateFitScale,
  calculateMediaCropStyle,
  MEDIA_ASPECT_RATIO as CAROUSEL_ASPECT_RATIO,
  getMediaSource,
  getMediaKind as mediaKind,
  getMediaLabel as mediaLabel,
} from 'terraso-web-client/storyMap/storyMapMediaUtils';
import {
  getStoryMapThemeCssVariables,
  STORY_MAP_CONTROL_SX,
  STORY_MAP_OVERLAY_CONTROL_SX,
} from 'terraso-web-client/storyMap/storyMapThemeUtils';

const MEDIA_PREVIEW_BACKGROUND =
  'color-mix(in srgb, var(--story-theme-text) 8%, var(--story-theme-background))';

const hasEmbeddedVideoPreview = item =>
  ['youtube', 'vimeo'].includes(item.source);

const StoryMapMediaItem = ({
  item,
  label,
  compact = false,
  fill = false,
  maxHeight,
  objectFit = 'contain',
  imageStyle,
  onImageLoad,
  showWaveform = false,
}) => {
  const [hasError, setHasError] = useState(false);
  const style = {
    display: 'block',
    height: fill ? '100%' : undefined,
    maxHeight: fill ? 'none' : maxHeight || (compact ? '160px' : '360px'),
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
    if (showWaveform) {
      return (
        <AudioWaveform
          key={getMediaSource(item)}
          label={mediaLabel(item)}
          onError={() => setHasError(true)}
          src={getMediaSource(item)}
        />
      );
    }
    return (
      <audio
        aria-label={mediaLabel(item)}
        controls
        onError={() => setHasError(true)}
        src={getMediaSource(item)}
        style={{ ...style, height: '54px' }}
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
        height: fill ? '100%' : compact ? '160px' : '300px',
      }}
    />
  );
};

export const CroppedImagePreview = ({
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
    <Box sx={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      <StoryMapMediaItem
        key={getMediaSource(item)}
        fill
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

const MediaPreviewButton = ({ children, sx, ...props }) => (
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

export const MediaViewer = ({ item, onClose, theme }) => (
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
            showWaveform
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

const MediaCollectionHeader = ({
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

const MediaItemActions = ({ children, presentation, sx }) => (
  <Box
    aria-label={
      presentation === 'toolbar'
        ? i18n.t('storyMap.media_current_actions')
        : undefined
    }
    role={presentation === 'toolbar' ? 'toolbar' : undefined}
    sx={{
      ...(presentation === 'menu'
        ? { position: 'absolute', right: 4, top: 4, zIndex: 2 }
        : {
            bgcolor: 'rgba(33, 33, 33, 0.92)',
            display: 'flex',
            justifyContent: 'center',
            minHeight: 40,
          }),
      ...sx,
    }}
  >
    {children}
  </Box>
);

export const GalleryPresentation = ({
  active = true,
  currentIndex: controlledCurrentIndex,
  headerAction,
  items,
  itemActionsSx,
  onCurrentIndexChange,
  onItemsReorder,
  presentationAction,
  renderItemActions,
  renderItemStatus,
  sx,
  theme,
}) => {
  const mediaRef = usePlaybackBoundary(active);
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
    setDragSourceIndex(null);
    setDropTargetIndex(null);
  };
  const onDragStart = (event, index) => {
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', String(index));
    event.dataTransfer.setDragImage(
      event.currentTarget,
      Math.round(event.currentTarget.clientWidth / 2),
      Math.round(event.currentTarget.clientHeight / 2)
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
          <MediaItemActions presentation="menu" sx={itemActionsSx}>
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

const usePlaybackBoundary = active => {
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

export const CarouselPresentation = ({
  active = true,
  headerAction,
  items,
  currentIndex: controlledCurrentIndex,
  itemActionsSx,
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
            <MediaItemActions presentation="toolbar" sx={itemActionsSx}>
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
