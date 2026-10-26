import { useEffect, useRef, useState } from 'react';
import i18n from 'i18next';
import logger from 'terraso-client-shared/monitoring/logger';
import CloseIcon from '@mui/icons-material/Close';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import OpenInFullIcon from '@mui/icons-material/OpenInFull';
import PauseIcon from '@mui/icons-material/Pause';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutlined';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import {
  Box,
  Dialog,
  IconButton,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';

import EmbeddedVideoPreview from 'terraso-web-client/storyMap/components/EmbeddedVideoPreview';
import {
  calculateMediaFitScale as calculateFitScale,
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

const formatAudioTime = seconds => {
  const roundedSeconds = Math.max(0, Math.floor(seconds || 0));
  const minutes = Math.floor(roundedSeconds / 60);
  return `${minutes}:${String(roundedSeconds % 60).padStart(2, '0')}`;
};

const StoryMapMediaItem = ({
  item,
  label,
  compact = false,
  fill = false,
  maxHeight,
  objectFit = 'contain',
  crop,
  imageStyle,
  onImageLoad,
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
          objectPosition: crop
            ? `${crop.position.x * 100}% ${crop.position.y * 100}%`
            : undefined,
          transform: crop ? `scale(${crop.scale})` : undefined,
          transformOrigin: crop
            ? `${crop.position.x * 100}% ${crop.position.y * 100}%`
            : undefined,
          ...imageStyle,
        }}
      />
    );
  }

  if (mediaKind(item) === 'audio') {
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

export const CroppedImagePreview = ({ item, label, objectFit = 'contain' }) => {
  const [fitScale, setFitScale] = useState();
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
          onImageLoad={({ currentTarget }) =>
            setFitScale(calculateFitScale(currentTarget))
          }
        />
      </Box>
    );
  }

  return (
    <StoryMapMediaItem
      key={getMediaSource(item)}
      crop={item.crop}
      fill
      item={item}
      label={label}
      objectFit={item.crop ? 'cover' : objectFit}
      onImageLoad={({ currentTarget }) =>
        setFitScale(calculateFitScale(currentTarget))
      }
    />
  );
};

const GalleryVideoPreview = ({ item }) => {
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
          objectFit: 'cover',
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

const GalleryAudioPreview = ({ item, onOpen, dragCursor }) => {
  const audioRef = useRef(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [hasError, setHasError] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const openViewer = () => {
    audioRef.current?.pause();
    onOpen();
  };

  const stopPropagation = action => event => {
    event.stopPropagation();
    action();
  };

  const togglePlayback = () => {
    const audio = audioRef.current;
    if (!audio || hasError) {
      return;
    }

    if (audio.paused) {
      audio.play().catch(error => {
        logger.error('Error playing Story Map audio', error);
        setHasError(true);
      });
      return;
    }
    audio.pause();
  };

  if (hasError) {
    return (
      <Box
        data-testid="gallery-audio-preview-fallback"
        component="button"
        type="button"
        aria-label={i18n.t('storyMap.media_open_audio')}
        onClick={openViewer}
        sx={{
          alignItems: 'center',
          bgcolor: MEDIA_PREVIEW_BACKGROUND,
          color: 'var(--story-theme-text)',
          cursor: dragCursor || 'pointer',
          display: 'flex',
          flexDirection: 'column',
          gap: 1,
          height: '100%',
          justifyContent: 'center',
          width: '100%',
        }}
      >
        <VolumeUpIcon fontSize="large" />
        <Typography role="alert" variant="caption">
          {i18n.t('storyMap.media_audio_unavailable')}
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      data-testid="gallery-audio-preview"
      onClick={openViewer}
      sx={{
        alignItems: 'center',
        bgcolor: MEDIA_PREVIEW_BACKGROUND,
        color: 'var(--story-theme-text)',
        cursor: dragCursor || 'pointer',
        display: 'flex',
        flexDirection: 'column',
        gap: 1,
        inset: 0,
        justifyContent: 'center',
        px: 2,
        position: 'absolute',
      }}
    >
      <audio
        aria-label={mediaLabel(item)}
        onEnded={() => setIsPlaying(false)}
        onError={() => setHasError(true)}
        onLoadedMetadata={({ currentTarget }) =>
          setDuration(currentTarget.duration)
        }
        onPause={() => setIsPlaying(false)}
        onPlay={() => setIsPlaying(true)}
        onTimeUpdate={({ currentTarget }) =>
          setCurrentTime(currentTarget.currentTime)
        }
        preload="metadata"
        ref={audioRef}
        src={getMediaSource(item)}
        style={{ display: 'none' }}
      />
      <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
        <IconButton
          aria-label={
            isPlaying
              ? i18n.t('storyMap.media_pause_audio')
              : i18n.t('storyMap.media_play_audio')
          }
          onClick={stopPropagation(togglePlayback)}
          sx={{
            ...STORY_MAP_OVERLAY_CONTROL_SX,
            borderRadius: '50%',
            height: 32,
            width: 32,
          }}
        >
          {isPlaying ? (
            <PauseIcon sx={{ fontSize: 18 }} />
          ) : (
            <PlayArrowIcon sx={{ fontSize: 18 }} />
          )}
        </IconButton>
        <Tooltip title={i18n.t('storyMap.media_open_audio')}>
          <IconButton
            aria-label={i18n.t('storyMap.media_expand_audio')}
            onClick={stopPropagation(openViewer)}
            sx={{
              ...STORY_MAP_OVERLAY_CONTROL_SX,
              borderRadius: '50%',
              height: 32,
              width: 32,
            }}
          >
            <OpenInFullIcon sx={{ fontSize: 17 }} />
          </IconButton>
        </Tooltip>
      </Stack>
      <Typography variant="caption" sx={{ fontSize: 14, whiteSpace: 'nowrap' }}>
        {formatAudioTime(currentTime)} / {formatAudioTime(duration)}
      </Typography>
    </Box>
  );
};

const GalleryTilePreview = ({ item }) => {
  if (hasEmbeddedVideoPreview(item)) {
    return <EmbeddedVideoPreview item={item} />;
  }
  if (mediaKind(item) === 'embedded') {
    return (
      <Box
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
      </Box>
    );
  }

  if (mediaKind(item) === 'image') {
    return <CroppedImagePreview item={item} objectFit="cover" />;
  }

  return <GalleryVideoPreview item={item} />;
};

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
          <StoryMapMediaItem item={item} />
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
      justifyContent: 'space-between',
      minHeight: 32,
      px: 0.5,
    }}
  >
    <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
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
        {mediaKind(item) === 'audio' ? (
          <Box
            aria-current={renderItemActions && isCurrent ? 'true' : undefined}
            onDragEnter={event => onDragOver(event, index)}
            onDragOver={event => onDragOver(event, index)}
            onDrop={event => onDrop(event, index)}
            sx={{
              aspectRatio: '4 / 3',
              overflow: 'hidden',
              position: 'relative',
            }}
          >
            <GalleryAudioPreview
              dragCursor={dragCursor}
              item={item}
              onOpen={openItem}
            />
          </Box>
        ) : (
          <Box
            aria-label={i18n.t('storyMap.media_open', {
              label: mediaLabel(item, index),
            })}
            aria-current={renderItemActions && isCurrent ? 'true' : undefined}
            component="button"
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
              border: 0,
              cursor: dragCursor || 'pointer',
              overflow: 'hidden',
              p: 0,
              '&:focus-visible': {
                outline: '3px solid',
                outlineColor: 'var(--story-theme-highlight)',
                outlineOffset: 3,
              },
            }}
            type="button"
          >
            <GalleryTilePreview item={item} />
          </Box>
        )}
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
  );
};

const CarouselStageMedia = ({ item, objectFit = 'contain' }) => {
  if (hasEmbeddedVideoPreview(item)) {
    return <EmbeddedVideoPreview item={item} />;
  }
  if (mediaKind(item) === 'image') {
    return <CroppedImagePreview item={item} objectFit={objectFit} />;
  }

  if (mediaKind(item) !== 'audio') {
    return <StoryMapMediaItem fill item={item} objectFit={objectFit} />;
  }

  return (
    <Stack
      spacing={2}
      sx={{
        alignItems: 'center',
        bgcolor: MEDIA_PREVIEW_BACKGROUND,
        color: 'var(--story-theme-text)',
        height: '100%',
        justifyContent: 'center',
        px: 3,
        width: '100%',
      }}
    >
      <VolumeUpIcon />
      <audio
        aria-label={mediaLabel(item)}
        controls
        src={getMediaSource(item)}
        style={{ height: '54px', maxWidth: '420px', width: '100%' }}
      />
    </Stack>
  );
};

const ExpandableCarouselStage = ({
  item,
  testId,
  onExpand,
  objectFit = 'contain',
}) =>
  mediaKind(item) === 'image' || hasEmbeddedVideoPreview(item) ? (
    <Box
      aria-label={i18n.t('storyMap.media_expand', { label: mediaLabel(item) })}
      component="button"
      data-testid={testId}
      onClick={onExpand}
      sx={{
        alignItems: 'center',
        aspectRatio: '16 / 9',
        background: 'none',
        bgcolor: hasEmbeddedVideoPreview(item)
          ? MEDIA_PREVIEW_BACKGROUND
          : 'var(--story-theme-background)',
        border: 0,
        cursor: 'zoom-in',
        display: 'flex',
        justifyContent: 'center',
        minWidth: 0,
        overflow: 'hidden',
        p: 0,
        width: '100%',
        '&:focus-visible': {
          outline: '3px solid',
          outlineColor: 'var(--story-theme-link)',
          outlineOffset: 3,
        },
      }}
      type="button"
    >
      <CarouselStageMedia item={item} objectFit={objectFit} />
    </Box>
  ) : (
    <Box
      sx={{
        aspectRatio: '16 / 9',
        bgcolor: MEDIA_PREVIEW_BACKGROUND,
        position: 'relative',
        overflow: 'hidden',
      }}
      data-testid={testId}
    >
      <CarouselStageMedia item={item} objectFit={objectFit} />
      <IconButton
        aria-label={i18n.t('storyMap.media_expand', {
          label: mediaLabel(item),
        })}
        onClick={onExpand}
        sx={{
          ...STORY_MAP_OVERLAY_CONTROL_SX,
          position: 'absolute',
          top: 8,
          right: 8,
        }}
      >
        <OpenInFullIcon />
      </IconButton>
    </Box>
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
  );
};
