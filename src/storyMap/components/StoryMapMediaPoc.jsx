import { useRef, useState } from 'react';
import CloseIcon from '@mui/icons-material/Close';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutlined';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import {
  Box,
  Dialog,
  DialogTitle,
  IconButton,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';

import RichTextEditor from 'terraso-web-client/common/components/RichTextEditor';
import StoryMap from 'terraso-web-client/storyMap/components/StoryMap';
import { getStoryMapThemeCssVariables } from 'terraso-web-client/storyMap/storyMapThemeUtils';

const POC_THEME_ID = 'theme-7';
const POC_THEME_STYLES = getStoryMapThemeCssVariables({
  themeId: POC_THEME_ID,
});
const POC_MEDIA_SURFACE = '#FFF6E3';
const CAROUSEL_ASPECT_RATIO = 16 / 9;

const calculateFitScale = ({ naturalHeight, naturalWidth }) => {
  if (!naturalHeight || !naturalWidth) {
    return undefined;
  }

  const imageAspectRatio = naturalWidth / naturalHeight;
  return Math.min(
    imageAspectRatio / CAROUSEL_ASPECT_RATIO,
    CAROUSEL_ASPECT_RATIO / imageAspectRatio
  );
};

const MEDIA_ITEMS = [
  {
    type: 'image/jpeg',
    signedUrl: '/storyMap/terraso-story-maps-img.jpg',
    crop: { position: { x: 0.5, y: 0.5 }, scale: 1 },
  },
  {
    type: 'image/png',
    signedUrl: '/storyMap/set-map-step-1.png',
    crop: { position: { x: 0.5, y: 0.5 }, scale: 1 },
  },
  {
    type: 'image/jpeg',
    signedUrl:
      'https://images.unsplash.com/photo-1497250681960-ef046c08a56e?auto=format&fit=crop&w=900&h=1200&q=85',
    crop: { position: { x: 0.5, y: 0.5 }, scale: 0.421875 },
  },
  {
    type: 'audio/mpeg',
    signedUrl: 'https://samplelib.com/lib/preview/mp3/sample-3s.mp3',
  },
  {
    type: 'video/mp4',
    signedUrl: 'https://samplelib.com/lib/preview/mp4/sample-5s.mp4',
  },
  {
    type: 'embedded',
    source: 'youtube',
    url: 'https://www.youtube.com/embed/aqz-KE-bpKQ',
  },
];

const createChapterDescription = () => [
  {
    type: 'heading-one',
    children: [{ text: 'Chapter context' }],
  },
  {
    type: 'paragraph',
    children: [
      { text: 'Participatory mapping', bold: true },
      { text: ' helps communities document local priorities and ' },
      { text: 'make evidence visible', italic: true },
      { text: ' in their own terms.' },
    ],
  },
  {
    type: 'bulleted-list',
    children: [
      {
        type: 'list-item',
        children: [{ text: 'Review the media in context' }],
      },
      { type: 'list-item', children: [{ text: 'Continue with the story' }] },
    ],
  },
  {
    type: 'paragraph',
    children: [
      { text: ' ' },
      {
        type: 'link',
        url: 'https://terraso.org',
        children: [{ text: 'Learn more' }],
      },
      { text: ' about Terraso Story Maps.' },
    ],
  },
];

const createInlineEditorialContent = () => [
  {
    type: 'rich-text',
    value: [
      {
        type: 'heading-one',
        children: [{ text: 'Mapping what matters' }],
      },
      {
        type: 'paragraph',
        children: [
          { text: 'Communities begin by identifying the places that shape ' },
          { text: 'daily life', italic: true },
          { text: '.' },
        ],
      },
    ],
  },
  { type: 'media', item: MEDIA_ITEMS[0] },
  {
    type: 'rich-text',
    value: [
      {
        type: 'heading-one',
        children: [{ text: 'Listening in context' }],
      },
      {
        type: 'paragraph',
        children: [
          { text: 'An audio recording can keep a local perspective close.' },
        ],
      },
    ],
  },
  { type: 'media', item: MEDIA_ITEMS[3] },
  {
    type: 'rich-text',
    value: [
      {
        type: 'heading-one',
        children: [{ text: 'Seeing the change' }],
      },
      {
        type: 'paragraph',
        children: [{ text: 'Video can document observations as they unfold.' }],
      },
    ],
  },
  { type: 'media', item: MEDIA_ITEMS[4] },
];

const POC_CONFIG = {
  style: 'mapbox://styles/mapbox/streets-v12',
  themeId: POC_THEME_ID,
  title: 'Multiple Media Patterns',
  subtitle: 'Compare the same chapter media in three viewer experiences.',
  byline: 'Story Map media POC',
  chapters: [
    {
      id: 'gallery',
      title: 'Gallery',
      description: createChapterDescription(),
      mediaPresentation: 'gallery',
      mediaItems: MEDIA_ITEMS,
      alignment: 'left',
    },
    {
      id: 'carousel',
      title: 'Carousel',
      description: createChapterDescription(),
      mediaPresentation: 'carousel',
      mediaItems: MEDIA_ITEMS,
      alignment: 'left',
    },
    {
      id: 'thumbnail-carousel',
      title: 'Thumbnail Carousel',
      description: createChapterDescription(),
      mediaPresentation: 'thumbnail-carousel',
      mediaItems: MEDIA_ITEMS,
      alignment: 'left',
    },
    {
      id: 'editorial-stack',
      title: 'Editorial Stack',
      description: createChapterDescription(),
      mediaPresentation: 'stack',
      mediaItems: MEDIA_ITEMS,
      alignment: 'left',
    },
    {
      id: 'inline-editorial',
      title: 'Inline Editorial',
      description: createChapterDescription(),
      inlineContent: createInlineEditorialContent(),
      mediaPresentation: 'inline-editorial',
      alignment: 'left',
    },
  ],
};

const mediaKind = item => {
  if (item.type.startsWith('image')) {
    return 'image';
  }

  if (item.type.startsWith('audio')) {
    return 'audio';
  }

  if (item.type.startsWith('video')) {
    return 'video';
  }

  return 'embedded';
};

const mediaTypeLabel = item => {
  const kind = mediaKind(item);

  return kind === 'embedded' ? 'Embedded video' : `${kind} media`;
};

const mediaLabel = (item, index) =>
  `${mediaTypeLabel(item)}${index === undefined ? '' : ` ${index + 1}`}`;

const mediaSource = item => item.signedUrl || item.url;

const PocMedia = ({
  item,
  compact = false,
  fill = false,
  maxHeight,
  objectFit = 'contain',
  crop,
  imageStyle,
  onImageLoad,
}) => {
  const style = {
    display: 'block',
    height: fill ? '100%' : undefined,
    maxHeight: fill ? 'none' : maxHeight || (compact ? '160px' : '360px'),
    objectFit,
    width: '100%',
  };

  if (mediaKind(item) === 'image') {
    return (
      <img
        src={mediaSource(item)}
        alt={mediaLabel(item)}
        onLoad={onImageLoad}
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
        src={mediaSource(item)}
        style={{ ...style, height: '54px' }}
      />
    );
  }

  if (mediaKind(item) === 'video') {
    return (
      <video
        aria-label={mediaLabel(item)}
        controls
        src={mediaSource(item)}
        style={style}
      />
    );
  }

  return (
    <iframe
      allowFullScreen
      aria-label={mediaLabel(item)}
      src={mediaSource(item)}
      title={mediaTypeLabel(item)}
      style={{
        ...style,
        height: fill ? '100%' : compact ? '160px' : '300px',
      }}
    />
  );
};

const CroppedImagePreview = ({ item, objectFit = 'contain' }) => {
  const [fitScale, setFitScale] = useState();
  const isFit =
    fitScale !== undefined && Math.abs(item.crop?.scale - fitScale) < 0.001;

  if (isFit) {
    return (
      <Box
        sx={{
          height: '100%',
          overflow: 'hidden',
          position: 'relative',
          width: '100%',
          '&::before': {
            backgroundImage: `url(${mediaSource(item)})`,
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
        <PocMedia
          fill
          imageStyle={{ position: 'relative', zIndex: 1 }}
          item={item}
          objectFit="contain"
          onImageLoad={({ currentTarget }) =>
            setFitScale(calculateFitScale(currentTarget))
          }
        />
      </Box>
    );
  }

  return (
    <PocMedia
      crop={item.crop}
      fill
      item={item}
      objectFit={item.crop ? 'cover' : objectFit}
      onImageLoad={({ currentTarget }) =>
        setFitScale(calculateFitScale(currentTarget))
      }
    />
  );
};

const GalleryTilePreview = ({ item }) => {
  if (mediaKind(item) === 'audio') {
    return (
      <Box
        sx={{
          alignItems: 'center',
          bgcolor: POC_MEDIA_SURFACE,
          color: 'var(--story-theme-text)',
          display: 'flex',
          height: '100%',
          justifyContent: 'center',
        }}
      >
        <VolumeUpIcon fontSize="large" />
      </Box>
    );
  }

  if (mediaKind(item) === 'embedded') {
    return (
      <Box
        sx={{
          alignItems: 'center',
          bgcolor: POC_MEDIA_SURFACE,
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

  return (
    <PocMedia
      fill
      item={item}
      objectFit="cover"
      {...(mediaKind(item) === 'video' ? { muted: true } : {})}
    />
  );
};

const MediaViewer = ({ item, onClose }) => (
  <Dialog
    fullWidth
    maxWidth="md"
    onClose={onClose}
    open={Boolean(item)}
    slotProps={{
      paper: {
        sx: {
          ...POC_THEME_STYLES,
          bgcolor: 'var(--story-theme-background)',
          boxShadow: 'none',
          maxHeight: 'calc(100dvh - 32px)',
          overflow: 'hidden',
        },
      },
    }}
  >
    {item && (
      <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <Stack
          data-testid="gallery-media-viewer-header"
          direction="row"
          sx={{
            alignItems: 'center',
            justifyContent: 'space-between',
            px: 1,
            py: 0.5,
          }}
        >
          <DialogTitle component="h2" sx={{ m: 0, p: 1 }}>
            {mediaTypeLabel(item)}
          </DialogTitle>
          <Tooltip title="Close media viewer">
            <IconButton
              aria-label="Close media viewer"
              onClick={onClose}
              sx={{
                '&:hover': { bgcolor: 'var(--story-theme-highlight)' },
                border: '1px solid var(--story-theme-text)',
                color: 'var(--story-theme-text)',
              }}
            >
              <CloseIcon />
            </IconButton>
          </Tooltip>
        </Stack>
        <Box
          data-testid="gallery-media-viewer-stage"
          sx={{
            alignItems: 'center',
            bgcolor: 'var(--story-theme-background)',
            display: 'flex',
            justifyContent: 'center',
            maxHeight: 'calc(100dvh - 112px)',
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
          <PocMedia item={item} />
        </Box>
      </Box>
    )}
  </Dialog>
);

const MediaCollectionHeader = ({
  currentIndex,
  footerAction,
  itemCount,
  presentationAction,
}) => (
  <Stack
    aria-label="Media collection actions"
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
      <Typography variant="caption" sx={{ whiteSpace: 'nowrap' }}>
        Media {currentIndex + 1} of {itemCount}
      </Typography>
    </Stack>
    {footerAction}
  </Stack>
);

const MediaItemActions = ({ children, presentation, sx }) => (
  <Box
    aria-label={
      presentation === 'toolbar' ? 'Current media actions' : undefined
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
  currentIndex: controlledCurrentIndex,
  footerAction,
  items,
  itemActionsSx,
  onCurrentIndexChange,
  presentationAction,
  renderItemActions,
}) => {
  const [uncontrolledCurrentIndex, setUncontrolledCurrentIndex] = useState(0);
  const [selectedItem, setSelectedItem] = useState(null);
  const currentIndex = controlledCurrentIndex ?? uncontrolledCurrentIndex;
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

  return (
    <Stack spacing={renderItemActions ? 0.5 : 1.5}>
      {renderItemActions && (
        <MediaCollectionHeader
          currentIndex={currentIndex}
          footerAction={footerAction}
          itemCount={items.length}
          presentationAction={presentationAction}
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
        {items.map((item, index) => {
          const isCurrent = index === currentIndex;
          return (
            <Stack
              key={mediaSource(item)}
              spacing={0}
              sx={{
                overflow: 'hidden',
                position: 'relative',
              }}
            >
              <Box
                aria-label={`Open ${mediaLabel(item, index)}`}
                aria-current={
                  renderItemActions && isCurrent ? 'true' : undefined
                }
                component="button"
                onClick={() => selectItem(item, index)}
                sx={{
                  aspectRatio: '4 / 3',
                  background: POC_MEDIA_SURFACE,
                  border: 0,
                  cursor: 'pointer',
                  overflow: 'hidden',
                  p: 0,
                  '&:focus-visible': {
                    outline: '3px solid',
                    outlineColor: 'storyTheme.highlight',
                    outlineOffset: 3,
                  },
                }}
                type="button"
              >
                <GalleryTilePreview item={item} />
              </Box>
              {renderItemActions && (
                <MediaItemActions presentation="menu" sx={itemActionsSx}>
                  {renderItemActions(item, index, 'menu')}
                </MediaItemActions>
              )}
            </Stack>
          );
        })}
      </Box>
      <MediaViewer item={selectedItem} onClose={closeViewer} />
    </Stack>
  );
};

const CarouselStageMedia = ({ item, objectFit = 'contain' }) => {
  if (mediaKind(item) === 'image') {
    return <CroppedImagePreview item={item} objectFit={objectFit} />;
  }

  if (mediaKind(item) !== 'audio') {
    return <PocMedia fill item={item} objectFit={objectFit} />;
  }

  return (
    <Stack
      spacing={2}
      sx={{
        alignItems: 'center',
        bgcolor: POC_MEDIA_SURFACE,
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
        src={mediaSource(item)}
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
}) => (
  <Box
    aria-label={`Expand ${mediaLabel(item)}`}
    component="button"
    data-testid={testId}
    onClick={onExpand}
    sx={{
      alignItems: 'center',
      aspectRatio: '16 / 9',
      background: 'none',
      bgcolor: POC_MEDIA_SURFACE,
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
);

export const CarouselPresentation = ({
  footerAction,
  items,
  currentIndex: controlledCurrentIndex,
  itemActionsSx,
  onCurrentIndexChange,
  navigationColor,
  presentationAction,
  renderItemActions,
  sx,
  theme,
}) => {
  const [uncontrolledCurrentIndex, setUncontrolledCurrentIndex] = useState(0);
  const [expandedItem, setExpandedItem] = useState(null);
  const currentIndex = controlledCurrentIndex ?? uncontrolledCurrentIndex;
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
  const next = () => setCurrentIndex(index => (index + 1) % items.length);

  return (
    <Stack spacing={renderItemActions ? 0.5 : 1.5} sx={sx}>
      {renderItemActions && (
        <MediaCollectionHeader
          currentIndex={currentIndex}
          footerAction={footerAction}
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
        <ExpandableCarouselStage
          item={currentItem}
          onExpand={() => setExpandedItem(currentItem)}
          testId="carousel-viewport"
        />
      </Stack>
      {items.length > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
          <Stack
            aria-label="Media navigation"
            direction="row"
            spacing={1}
            sx={{
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Tooltip title="Previous media">
              <IconButton
                aria-label="Previous media"
                onClick={previous}
                sx={{
                  '&:hover': {
                    bgcolor: theme?.highlight || 'var(--story-theme-highlight)',
                  },
                  color:
                    navigationColor || theme?.text || 'var(--story-theme-text)',
                }}
              >
                <NavigateBeforeIcon />
              </IconButton>
            </Tooltip>
            <Stack aria-label="Media position" direction="row" spacing={0.75}>
              {items.map((item, index) => (
                <Box
                  aria-current={index === currentIndex ? 'true' : undefined}
                  aria-label={mediaLabel(item, index)}
                  component="button"
                  key={mediaSource(item)}
                  onClick={() => setCurrentIndex(index)}
                  sx={{
                    bgcolor:
                      index === currentIndex
                        ? theme?.highlight || 'var(--story-theme-highlight)'
                        : 'transparent',
                    border: '1px solid',
                    borderColor:
                      navigationColor ||
                      theme?.text ||
                      'var(--story-theme-text)',
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
            <Tooltip title="Next media">
              <IconButton
                aria-label="Next media"
                onClick={next}
                sx={{
                  '&:hover': {
                    bgcolor: theme?.highlight || 'var(--story-theme-highlight)',
                  },
                  color:
                    navigationColor || theme?.text || 'var(--story-theme-text)',
                }}
              >
                <NavigateNextIcon />
              </IconButton>
            </Tooltip>
          </Stack>
        </Box>
      )}
      <MediaViewer item={expandedItem} onClose={() => setExpandedItem(null)} />
    </Stack>
  );
};

const ThumbnailPreview = ({ item }) => {
  if (mediaKind(item) === 'image') {
    return <PocMedia fill item={item} />;
  }

  const Icon =
    mediaKind(item) === 'audio' ? VolumeUpIcon : PlayCircleOutlineIcon;

  return (
    <Box
      sx={{
        alignItems: 'center',
        bgcolor: POC_MEDIA_SURFACE,
        color: 'var(--story-theme-text)',
        display: 'flex',
        height: '100%',
        justifyContent: 'center',
      }}
    >
      <Icon />
    </Box>
  );
};

const ThumbnailCarouselPresentation = ({ items }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [expandedItem, setExpandedItem] = useState(null);
  const previewStripRef = useRef(null);
  const currentItem = items[currentIndex];

  const scrollPreviews = direction => {
    const previewStrip = previewStripRef.current;

    previewStrip?.scrollBy({
      behavior: 'smooth',
      left: direction * previewStrip.clientWidth * 0.8,
    });
  };

  return (
    <Stack spacing={1}>
      <ExpandableCarouselStage
        item={currentItem}
        onExpand={() => setExpandedItem(currentItem)}
        objectFit="cover"
        testId="thumbnail-carousel-viewport"
      />
      <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center' }}>
        <Tooltip title="Previous previews">
          <IconButton
            aria-label="Previous previews"
            onClick={() => scrollPreviews(-1)}
            sx={{
              bgcolor: 'transparent',
              color: 'var(--story-theme-text)',
              flex: '0 0 auto',
              '&:hover': { bgcolor: 'var(--story-theme-highlight)' },
            }}
          >
            <NavigateBeforeIcon />
          </IconButton>
        </Tooltip>
        <Box
          aria-label="Media previews"
          data-testid="thumbnail-carousel-preview-strip"
          ref={previewStripRef}
          sx={{
            display: 'flex',
            flex: 1,
            gap: 0.75,
            minWidth: 0,
            overflowX: 'auto',
            scrollbarWidth: 'none',
            '&::-webkit-scrollbar': { display: 'none' },
          }}
        >
          {items.map((item, index) => (
            <Box
              aria-current={index === currentIndex ? 'true' : undefined}
              aria-label={`Show ${mediaLabel(item, index)}`}
              component="button"
              key={mediaSource(item)}
              onClick={() => setCurrentIndex(index)}
              sx={{
                aspectRatio: '16 / 9',
                background: POC_MEDIA_SURFACE,
                border: '2px solid',
                borderColor:
                  index === currentIndex
                    ? 'var(--story-theme-highlight)'
                    : 'var(--story-theme-text)',
                cursor: 'pointer',
                flex: '0 0 96px',
                opacity: index === currentIndex ? 1 : 0.6,
                overflow: 'hidden',
                p: 0,
                '&:focus-visible': {
                  outline: '3px solid',
                  outlineColor: 'storyTheme.highlight',
                  outlineOffset: 2,
                },
              }}
              type="button"
            >
              <ThumbnailPreview item={item} />
            </Box>
          ))}
        </Box>
        <Tooltip title="Next previews">
          <IconButton
            aria-label="Next previews"
            onClick={() => scrollPreviews(1)}
            sx={{
              bgcolor: 'transparent',
              color: 'var(--story-theme-text)',
              flex: '0 0 auto',
              '&:hover': { bgcolor: 'var(--story-theme-highlight)' },
            }}
          >
            <NavigateNextIcon />
          </IconButton>
        </Tooltip>
      </Stack>
      <MediaViewer item={expandedItem} onClose={() => setExpandedItem(null)} />
    </Stack>
  );
};

const StackPresentation = ({ items }) => (
  <Stack spacing={2}>
    {items.map(item => (
      <PocMedia item={item} key={mediaSource(item)} maxHeight="none" />
    ))}
  </Stack>
);

const InlineEditorialPresentation = ({ blocks }) => (
  <Stack spacing={2}>
    {blocks.map((block, index) =>
      block.type === 'media' ? (
        <PocMedia
          item={block.item}
          key={mediaSource(block.item)}
          maxHeight="none"
        />
      ) : (
        <RichTextEditor
          editable={false}
          key={`rich-text-${index}`}
          value={block.value}
        />
      )
    )}
  </Stack>
);

const PocChapter = ({ record, active }) => {
  const presentation =
    record.mediaPresentation === 'gallery' ? (
      <GalleryPresentation items={record.mediaItems} />
    ) : record.mediaPresentation === 'carousel' ? (
      <CarouselPresentation items={record.mediaItems} />
    ) : record.mediaPresentation === 'thumbnail-carousel' ? (
      <ThumbnailCarouselPresentation items={record.mediaItems} />
    ) : record.mediaPresentation === 'inline-editorial' ? (
      <InlineEditorialPresentation blocks={record.inlineContent} />
    ) : (
      <StackPresentation items={record.mediaItems} />
    );

  return (
    <Box
      component="section"
      aria-label={`Chapter: ${record.title}`}
      className="step-container lefty"
      sx={({ breakpoints }) => ({
        [breakpoints.not('xs')]: { opacity: active ? 0.99 : 0.25 },
      })}
    >
      <Stack
        className="story-theme step-content"
        spacing={1.5}
        sx={{ width: '50vw' }}
      >
        <Typography component="h3" variant="h3">
          {record.title}
        </Typography>
        {presentation}
        {record.mediaPresentation !== 'inline-editorial' && (
          <RichTextEditor editable={false} value={record.description} />
        )}
      </Stack>
    </Box>
  );
};

const StoryMapMediaPoc = () => (
  <StoryMap config={POC_CONFIG} ChapterComponent={PocChapter} />
);

export default StoryMapMediaPoc;
