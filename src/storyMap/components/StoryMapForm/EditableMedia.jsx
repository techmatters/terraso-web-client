/*
 * Copyright © 2021-2023 Technology Matters
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
import { memo, useMemo, useState } from 'react';
import i18n from 'i18next';
import { useTranslation } from 'react-i18next';
import { v4 as uuidv4 } from 'uuid';
import AddIcon from '@mui/icons-material/Add';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import CropIcon from '@mui/icons-material/Crop';
import DeleteIcon from '@mui/icons-material/Delete';
import GridViewOutlinedIcon from '@mui/icons-material/GridViewOutlined';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import ReportProblemOutlinedIcon from '@mui/icons-material/ReportProblemOutlined';
import ViewCarouselOutlinedIcon from '@mui/icons-material/ViewCarouselOutlined';
import {
  Box,
  Button,
  IconButton,
  ListItemIcon,
  Menu,
  MenuItem,
  Paper,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from '@mui/material';

import ConfirmButton from 'terraso-web-client/common/components/ConfirmButton';
import AddMediaDialog from 'terraso-web-client/storyMap/components/StoryMapForm/AddMediaDialog';
import ImageCropDialog from 'terraso-web-client/storyMap/components/StoryMapForm/ImageCropDialog';
import {
  useStoryMapConfigDataContext,
  useStoryMapMediaContext,
} from 'terraso-web-client/storyMap/components/StoryMapForm/storyMapConfigContext';
import {
  CarouselPresentation,
  GalleryPresentation,
} from 'terraso-web-client/storyMap/components/StoryMapMedia';
import {
  MAX_CHAPTER_MEDIA_ITEMS,
  getMediaLabel as mediaLabel,
} from 'terraso-web-client/storyMap/storyMapMediaUtils';
import {
  getResolvedStoryMapTheme,
  getStoryMapThemeCssVariables,
  STORY_MAP_CONTROL_SX,
  STORY_MAP_OVERLAY_CONTROL_SX,
} from 'terraso-web-client/storyMap/storyMapThemeUtils';

const MEDIA_TYPES = {
  IMAGE: 'image',
  AUDIO: 'audio',
};

const MEDIA_PRESENTATION_BUTTON_SX = {
  ...STORY_MAP_CONTROL_SX,
  borderColor: 'var(--story-theme-text)',
  height: 32,
  minWidth: 36,
  p: 0.5,
  width: 36,
  '&.Mui-selected, &.Mui-selected:hover': {
    bgcolor: 'var(--story-theme-highlight)',
    color: 'var(--story-theme-highlight-text)',
  },
};

const moveMedia = (mediaItems, index, direction) => {
  const nextIndex = index + direction;
  if (nextIndex < 0 || nextIndex >= mediaItems.length) {
    return mediaItems;
  }

  const nextMediaItems = [...mediaItems];
  [nextMediaItems[index], nextMediaItems[nextIndex]] = [
    nextMediaItems[nextIndex],
    nextMediaItems[index],
  ];
  return nextMediaItems;
};

const reorderMedia = (mediaItems, sourceIndex, destinationIndex) => {
  const nextMediaItems = [...mediaItems];
  const [media] = nextMediaItems.splice(sourceIndex, 1);
  nextMediaItems.splice(destinationIndex, 0, media);
  return nextMediaItems;
};

const getMediaDeleteConfirmProps = media => {
  if (media.type.startsWith(MEDIA_TYPES.IMAGE)) {
    return {
      title: 'storyMap.form_media_image_delete_confirm_title',
      message: 'storyMap.form_media_image_delete_confirm_message',
      button: 'storyMap.form_media_image_delete_confirm_button',
    };
  }
  if (media.type.startsWith(MEDIA_TYPES.AUDIO)) {
    return {
      title: 'storyMap.form_media_audio_delete_confirm_title',
      message: 'storyMap.form_media_audio_delete_confirm_message',
      button: 'storyMap.form_media_audio_delete_confirm_button',
    };
  }
  return {
    title: 'storyMap.form_media_video_delete_confirm_title',
    message: 'storyMap.form_media_video_delete_confirm_message',
    button: 'storyMap.form_media_video_delete_confirm_button',
  };
};

const ImageAltTextBadge = ({ hasAltText, label, onClick }) => (
  <Tooltip
    title={
      hasAltText
        ? i18n.t('storyMap.media_edit_alt')
        : i18n.t('storyMap.media_add_alt')
    }
  >
    <Button
      aria-label={i18n.t(
        hasAltText
          ? 'storyMap.media_edit_alt_label'
          : 'storyMap.media_add_alt_label',
        { label }
      )}
      color={hasAltText ? 'inherit' : 'warning'}
      onClick={event => {
        event.stopPropagation();
        onClick();
      }}
      size="small"
      startIcon={
        !hasAltText && <ReportProblemOutlinedIcon sx={{ fontSize: 14 }} />
      }
      sx={{
        bgcolor: hasAltText ? 'var(--story-theme-text)' : 'warning.main',
        borderRadius: 0.5,
        color: hasAltText ? 'var(--story-theme-background)' : 'white',
        fontSize: 11,
        lineHeight: 1,
        minHeight: 24,
        minWidth: 0,
        px: 0.5,
        '& .MuiButton-startIcon': { marginLeft: 0, marginRight: 0.25 },
        '&:hover': {
          bgcolor: hasAltText ? 'var(--story-theme-highlight)' : 'warning.dark',
          color: hasAltText ? 'var(--story-theme-highlight-text)' : 'white',
        },
      }}
    >
      ALT
    </Button>
  </Tooltip>
);

const EmptyMediaPlaceholder = ({ onUpload }) => {
  const { t } = useTranslation();

  return (
    <Stack
      spacing={2}
      component={Paper}
      sx={{
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'blue.mid',
        minHeight: 150,
        p: 2,
      }}
    >
      <Typography variant="caption" sx={{ textAlign: 'center' }}>
        {t('storyMap.form_media_placeholder')}
      </Typography>
      <Button variant="outlined" onClick={onUpload}>
        {t('storyMap.form_media_upload')}
      </Button>
    </Stack>
  );
};

const AddMediaButton = ({ compact = false, disabled = false, onClick }) => {
  const limitMessage = i18n.t('storyMap.media_limit_reached');
  const addLabel = i18n.t('storyMap.media_add_label');

  return (
    <Tooltip title={disabled ? limitMessage : addLabel}>
      <span>
        <Button
          aria-description={disabled ? limitMessage : undefined}
          aria-label={addLabel}
          disabled={disabled}
          onClick={onClick}
          size="small"
          sx={{
            minWidth: compact ? 32 : { xs: 32, sm: 64 },
            px: compact ? 0.5 : { xs: 0.5, sm: 1.25 },
            whiteSpace: 'nowrap',
            ...(compact && {
              '@container (min-width: 300px)': {
                minWidth: 64,
                px: 1.25,
              },
            }),
          }}
          variant="contained"
        >
          <AddIcon fontSize="small" />
          <Box
            component="span"
            sx={{
              display: compact ? 'none' : { xs: 'none', sm: 'inline' },
              ml: 1,
              ...(compact && {
                '@container (min-width: 300px)': { display: 'inline' },
              }),
            }}
          >
            {i18n.t('storyMap.media_add')}
          </Box>
        </Button>
      </span>
    </Tooltip>
  );
};

const MediaActionsMenu = ({
  canMoveEarlier,
  canMoveLater,
  deleteConfirmProps,
  label,
  onCrop,
  onDelete,
  onMoveEarlier,
  onMoveLater,
}) => {
  const { t } = useTranslation();
  const [anchorElement, setAnchorElement] = useState(null);
  const closeMenu = () => setAnchorElement(null);
  const runAction = action => () => {
    closeMenu();
    action();
  };

  return (
    <>
      <IconButton
        aria-label={i18n.t('storyMap.media_actions_for', { label: label })}
        onClick={event => {
          event.stopPropagation();
          setAnchorElement(event.currentTarget);
        }}
        size="small"
        sx={{
          ...STORY_MAP_OVERLAY_CONTROL_SX,
          height: 32,
          width: 32,
        }}
      >
        <MoreVertIcon fontSize="small" />
      </IconButton>
      <Menu
        anchorEl={anchorElement}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        onClick={event => event.stopPropagation()}
        onClose={closeMenu}
        open={Boolean(anchorElement)}
        slotProps={{
          list: { dense: true, sx: { py: 0.5 } },
          paper: { sx: { width: 176 } },
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
      >
        {onCrop && (
          <MenuItem onClick={runAction(onCrop)} sx={{ minHeight: 44, px: 1.5 }}>
            <ListItemIcon sx={{ minWidth: 28 }}>
              <CropIcon sx={{ fontSize: 18 }} />
            </ListItemIcon>
            <Typography
              component="span"
              sx={{ fontSize: 14, lineHeight: '20px' }}
            >
              {i18n.t('storyMap.media_crop')}
            </Typography>
          </MenuItem>
        )}
        <MenuItem
          disabled={!canMoveEarlier}
          onClick={runAction(onMoveEarlier)}
          sx={{ minHeight: 44, px: 1.5 }}
        >
          <ListItemIcon sx={{ minWidth: 28 }}>
            <ArrowUpwardIcon sx={{ fontSize: 18 }} />
          </ListItemIcon>
          <Typography
            component="span"
            sx={{ fontSize: 14, lineHeight: '20px' }}
          >
            {i18n.t('storyMap.media_move_earlier')}
          </Typography>
        </MenuItem>
        <MenuItem
          disabled={!canMoveLater}
          onClick={runAction(onMoveLater)}
          sx={{ minHeight: 44, px: 1.5 }}
        >
          <ListItemIcon sx={{ minWidth: 28 }}>
            <ArrowDownwardIcon sx={{ fontSize: 18 }} />
          </ListItemIcon>
          <Typography
            component="span"
            sx={{ fontSize: 14, lineHeight: '20px' }}
          >
            {i18n.t('storyMap.media_move_later')}
          </Typography>
        </MenuItem>
        <ConfirmButton
          ariaLabel={i18n.t('storyMap.media_delete')}
          buttonProps={{
            role: 'menuitem',
            sx: {
              borderRadius: 0,
              color: 'error.main',
              justifyContent: 'flex-start',
              minHeight: 44,
              px: 1.5,
              width: '100%',
            },
          }}
          confirmButton={t(deleteConfirmProps.button)}
          confirmButtonDestructive
          confirmMessage={t(deleteConfirmProps.message)}
          confirmTitle={t(deleteConfirmProps.title)}
          onConfirm={onDelete}
          variant="text"
        >
          <ListItemIcon sx={{ color: 'inherit', minWidth: 28 }}>
            <DeleteIcon sx={{ fontSize: 18 }} />
          </ListItemIcon>
          <Typography
            component="span"
            sx={{ fontSize: 14, lineHeight: '20px' }}
          >
            {i18n.t('storyMap.media_delete')}
          </Typography>
        </ConfirmButton>
      </Menu>
    </>
  );
};

const MediaActionsToolbar = ({
  canMoveEarlier,
  canMoveLater,
  deleteConfirmProps,
  label,
  onCrop,
  onDelete,
  onMoveEarlier,
  onMoveLater,
}) => {
  const { t } = useTranslation();
  const actionButtonSx = {
    color: 'white',
    height: 36,
    width: 36,
    '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.08)' },
    '&.Mui-disabled': { color: 'rgba(255, 255, 255, 0.45)' },
  };

  return (
    <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
      {onCrop && (
        <Tooltip
          placement="top"
          title={i18n.t('storyMap.media_crop_label', { label: label })}
        >
          <IconButton
            aria-label={i18n.t('storyMap.media_crop_label', { label: label })}
            onClick={onCrop}
            size="small"
            sx={actionButtonSx}
          >
            <CropIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      )}
      {onMoveEarlier && (
        <Tooltip placement="top" title={i18n.t('storyMap.media_move_earlier')}>
          <span>
            <IconButton
              aria-label={i18n.t('storyMap.media_move_earlier_label', {
                label: label,
              })}
              disabled={!canMoveEarlier}
              onClick={onMoveEarlier}
              size="small"
              sx={actionButtonSx}
            >
              <NavigateBeforeIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
      )}
      {onMoveLater && (
        <Tooltip placement="top" title={i18n.t('storyMap.media_move_later')}>
          <span>
            <IconButton
              aria-label={i18n.t('storyMap.media_move_later_label', {
                label: label,
              })}
              disabled={!canMoveLater}
              onClick={onMoveLater}
              size="small"
              sx={actionButtonSx}
            >
              <NavigateNextIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
      )}
      <ConfirmButton
        ariaLabel={i18n.t('storyMap.media_remove_label', { label: label })}
        buttonProps={{ sx: { ...actionButtonSx, minWidth: 36, p: 0 } }}
        confirmButton={t(deleteConfirmProps.button)}
        confirmButtonDestructive
        confirmMessage={t(deleteConfirmProps.message)}
        confirmTitle={t(deleteConfirmProps.title)}
        onConfirm={onDelete}
        tooltip={i18n.t('storyMap.media_remove_label', { label: label })}
        tooltipPlacement="top"
        variant="text"
      >
        <DeleteIcon fontSize="small" />
      </ConfirmButton>
    </Stack>
  );
};

const EditableMedia = ({
  onChange,
  onPresentationChange,
  presentation = 'carousel',
  value,
}) => {
  useTranslation();
  const { config } = useStoryMapConfigDataContext();
  const { getMediaFile } = useStoryMapMediaContext();
  const [cropIndex, setCropIndex] = useState(null);
  const [open, setOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const mediaItems = value || [];
  const canAddMedia = mediaItems.length < MAX_CHAPTER_MEDIA_ITEMS;
  const hasMultipleItems = mediaItems.length > 1;
  const carouselThemeStyles = useMemo(
    () => getStoryMapThemeCssVariables(config),
    [config]
  );
  const carouselTheme = useMemo(
    () => getResolvedStoryMapTheme(config),
    [config]
  );
  const Presentation =
    hasMultipleItems && presentation === 'gallery'
      ? GalleryPresentation
      : CarouselPresentation;

  const updateImage = (crop, altText) => {
    onChange(
      mediaItems.map((media, index) => {
        if (index !== cropIndex) {
          return media;
        }

        const { altText: existingAltText, ...mediaWithoutAltText } = media;
        return {
          ...mediaWithoutAltText,
          ...(crop ? { crop } : {}),
          ...(altText ? { altText } : {}),
        };
      })
    );
    setCropIndex(null);
  };

  const moveMediaAtIndex = (index, direction) => {
    const nextIndex = index + direction;
    onChange(moveMedia(mediaItems, index, direction));
    setSelectedIndex(nextIndex);
  };

  const reorderMediaAtIndex = (sourceIndex, destinationIndex) => {
    onChange(reorderMedia(mediaItems, sourceIndex, destinationIndex));
    setSelectedIndex(destinationIndex);
  };

  const removeMediaAtIndex = index => {
    onChange(mediaItems.filter((media, mediaIndex) => mediaIndex !== index));
    setSelectedIndex(index =>
      Math.max(0, Math.min(index, mediaItems.length - 2))
    );
  };

  return (
    <Stack
      spacing={2}
      sx={{ ...carouselThemeStyles, color: 'var(--story-theme-text)' }}
    >
      {open && (
        <AddMediaDialog
          canAdd={canAddMedia}
          open={open}
          onClose={() => {
            setOpen(false);
          }}
          onAdd={media => {
            if (!canAddMedia) {
              return;
            }
            const nextMedia = {
              ...media,
              id: media.contentId || uuidv4(),
            };
            onChange([...mediaItems, nextMedia]);
            setSelectedIndex(mediaItems.length);
            setOpen(false);
          }}
        />
      )}
      {!mediaItems.length && (
        <EmptyMediaPlaceholder onUpload={() => setOpen(true)} />
      )}
      {mediaItems.length > 0 && (
        <Stack spacing={1}>
          <Presentation
            currentIndex={selectedIndex}
            headerAction={
              <AddMediaButton
                compact
                disabled={!canAddMedia}
                onClick={() => setOpen(true)}
              />
            }
            items={mediaItems.map(media => ({
              ...media,
              url: media.url || getMediaFile(media.contentId),
            }))}
            onCurrentIndexChange={setSelectedIndex}
            onItemsReorder={
              hasMultipleItems && presentation === 'gallery'
                ? reorderMediaAtIndex
                : undefined
            }
            presentationAction={
              hasMultipleItems && (
                <ToggleButtonGroup
                  aria-label={i18n.t('storyMap.media_display_as')}
                  exclusive
                  onChange={(_event, nextPresentation) => {
                    if (nextPresentation) {
                      onPresentationChange(nextPresentation);
                    }
                  }}
                  size="small"
                  value={presentation}
                >
                  <Tooltip
                    placement="top"
                    title={i18n.t('storyMap.media_display_carousel')}
                  >
                    <ToggleButton
                      aria-label={i18n.t('storyMap.media_display_carousel')}
                      sx={MEDIA_PRESENTATION_BUTTON_SX}
                      value="carousel"
                    >
                      <ViewCarouselOutlinedIcon fontSize="small" />
                    </ToggleButton>
                  </Tooltip>
                  <Tooltip
                    placement="top"
                    title={i18n.t('storyMap.media_display_gallery')}
                  >
                    <ToggleButton
                      aria-label={i18n.t('storyMap.media_display_gallery')}
                      sx={MEDIA_PRESENTATION_BUTTON_SX}
                      value="gallery"
                    >
                      <GridViewOutlinedIcon fontSize="small" />
                    </ToggleButton>
                  </Tooltip>
                </ToggleButtonGroup>
              )
            }
            sx={carouselThemeStyles}
            theme={carouselTheme}
            renderItemActions={(media, index, actionPresentation) => {
              const deleteConfirmProps = getMediaDeleteConfirmProps(media);
              const actionProps = {
                canMoveEarlier: index > 0,
                canMoveLater: index < mediaItems.length - 1,
                deleteConfirmProps,
                label: mediaLabel(media, index),
                onCrop: media.type.startsWith(MEDIA_TYPES.IMAGE)
                  ? () => setCropIndex(index)
                  : null,
                onDelete: () => removeMediaAtIndex(index),
                onMoveEarlier: hasMultipleItems
                  ? () => moveMediaAtIndex(index, -1)
                  : null,
                onMoveLater: hasMultipleItems
                  ? () => moveMediaAtIndex(index, 1)
                  : null,
              };

              if (actionPresentation === 'toolbar') {
                return <MediaActionsToolbar {...actionProps} />;
              }

              return <MediaActionsMenu {...actionProps} />;
            }}
            renderItemStatus={(media, index) =>
              media.type.startsWith(MEDIA_TYPES.IMAGE) ? (
                <ImageAltTextBadge
                  hasAltText={Boolean(media.altText)}
                  label={mediaLabel(media, index)}
                  onClick={() => setCropIndex(index)}
                />
              ) : null
            }
          />
        </Stack>
      )}
      {cropIndex !== null && (
        <ImageCropDialog
          image={mediaItems[cropIndex]}
          onClose={() => setCropIndex(null)}
          onSave={updateImage}
        />
      )}
    </Stack>
  );
};

export default memo(EditableMedia);
