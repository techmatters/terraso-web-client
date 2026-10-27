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
// Component for editing and uploading a pictures or a audio file
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import getVideoId from 'get-video-id';
import i18n from 'i18next';
import _ from 'lodash/fp';
import AvatarEditor from 'react-avatar-editor';
import { useTranslation } from 'react-i18next';
import { v4 as uuidv4 } from 'uuid';
import AddIcon from '@mui/icons-material/Add';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import CloudUploadOutlinedIcon from '@mui/icons-material/CloudUploadOutlined';
import CropIcon from '@mui/icons-material/Crop';
import DeleteIcon from '@mui/icons-material/Delete';
import GridViewOutlinedIcon from '@mui/icons-material/GridViewOutlined';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import OpenInNew from '@mui/icons-material/OpenInNew';
import ReportProblemOutlinedIcon from '@mui/icons-material/ReportProblemOutlined';
import ViewCarouselOutlinedIcon from '@mui/icons-material/ViewCarouselOutlined';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormHelperText,
  IconButton,
  Link,
  ListItemIcon,
  Menu,
  MenuItem,
  OutlinedInput,
  Paper,
  Slider,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from '@mui/material';

import ConfirmButton from 'terraso-web-client/common/components/ConfirmButton';
import DropZone from 'terraso-web-client/common/components/DropZone';
import { openFile } from 'terraso-web-client/common/fileUtils';
import {
  useStoryMapConfigDataContext,
  useStoryMapMediaContext,
} from 'terraso-web-client/storyMap/components/StoryMapForm/storyMapConfigContext';
import {
  CarouselPresentation,
  CroppedImagePreview,
  GalleryPresentation,
} from 'terraso-web-client/storyMap/components/StoryMapMedia';
import {
  calculateMediaFitScale as calculateFitScale,
  MEDIA_ASPECT_RATIO as CAROUSEL_ASPECT_RATIO,
  getMediaSource,
  MAX_CHAPTER_MEDIA_ITEMS,
  getMediaLabel as mediaLabel,
} from 'terraso-web-client/storyMap/storyMapMediaUtils';
import {
  getResolvedStoryMapTheme,
  getStoryMapThemeCssVariables,
  STORY_MAP_CONTROL_SX,
  STORY_MAP_OVERLAY_CONTROL_SX,
} from 'terraso-web-client/storyMap/storyMapThemeUtils';

import {
  STORY_MAP_MEDIA_ACCEPTED_EXTENSIONS,
  STORY_MAP_MEDIA_ACCEPTED_TYPES,
  STORY_MAP_MEDIA_MAX_SIZE,
} from 'terraso-web-client/config';

const MEDIA_TYPES = {
  IMAGE: 'image',
  AUDIO: 'audio',
  VIDEO: 'video',
  EMBEDDED: 'embedded',
};

const DEFAULT_CROP = { position: { x: 0.5, y: 0.5 }, scale: 1 };
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

const MEDIA_CONFIG = {
  [MEDIA_TYPES.AUDIO]: {
    defaultHeight: 130,
    controlsHeight: 54,
  },
  [MEDIA_TYPES.VIDEO]: {
    defaultHeight: 370,
    minHeight: 270,
    maxHeight: 500,
    controlsOffset: 70,
  },
  [MEDIA_TYPES.EMBEDDED]: {
    defaultHeight: 300,
  },
};

const LOADING_STATES = {
  IDLE: 'idle',
  LOADING: 'loading',
  LOADED: 'loaded',
  ERROR: 'error',
};

const useMediaLoad = (defaultHeight, elementRef, onLoadCallback) => {
  const [containerHeight, setContainerHeight] = useState(defaultHeight);
  const [loadingState, setLoadingState] = useState(LOADING_STATES.IDLE);

  const handleLoad = useCallback(() => {
    if (!elementRef.current || !onLoadCallback) {
      return;
    }

    try {
      setLoadingState(LOADING_STATES.LOADING);
      const newHeight = onLoadCallback(elementRef.current);
      if (newHeight && newHeight !== containerHeight) {
        setContainerHeight(newHeight);
      }
      setLoadingState(LOADING_STATES.LOADED);
    } catch (error) {
      console.error('Error calculating media height:', error);
      setLoadingState(LOADING_STATES.ERROR);
    }
  }, [elementRef, onLoadCallback, containerHeight]);

  const handleError = useCallback(() => {
    setLoadingState(LOADING_STATES.ERROR);
  }, []);

  return [containerHeight, handleLoad, handleError, loadingState];
};

const getMediaSrc = getMediaSource;

// Calculate media height to avoid scroller jumps in story map editor
// This is needed because media elements are loaded asynchronously
const calculateVideoHeight = videoElement => {
  if (!videoElement || !videoElement.videoWidth || !videoElement.videoHeight) {
    return MEDIA_CONFIG[MEDIA_TYPES.VIDEO].defaultHeight;
  }

  const aspectRatio = videoElement.videoHeight / videoElement.videoWidth;
  const videoDisplayHeight = videoElement.offsetWidth * aspectRatio;
  const config = MEDIA_CONFIG[MEDIA_TYPES.VIDEO];
  return Math.max(
    config.minHeight,
    Math.min(config.maxHeight, videoDisplayHeight + config.controlsOffset)
  );
};

const calculateAudioHeight = () => {
  const config = MEDIA_CONFIG[MEDIA_TYPES.AUDIO];
  return config.controlsHeight + 92;
};

const MediaActionBar = memo(
  ({ onUpdate, onDelete, processing, deleteConfirmProps }) => {
    const { t } = useTranslation();

    return (
      <Stack
        direction="row"
        spacing={1}
        role="toolbar"
        aria-label={t('storyMap.form_media_actions')}
        sx={{
          justifyContent: 'center',
          alignItems: 'center',
          color: 'white',
          background: 'rgba(0,0,0,0.5)',
          width: '100%',
          pt: 2,
          pb: 2,
        }}
      >
        <Button
          variant="outlined"
          onClick={onUpdate}
          sx={({ palette }) => ({
            backgroundColor: 'white',
            '&:hover': {
              backgroundColor: palette.blue.dark3,
            },
          })}
          aria-label={t('storyMap.form_media_update_label')}
        >
          {t('storyMap.form_media_update_label')}
        </Button>
        <ConfirmButton
          onConfirm={onDelete}
          loading={processing}
          variant="text"
          confirmButtonDestructive
          buttonProps={{
            title: t('storyMap.form_media_delete'),
            sx: {
              minWidth: 'auto',
            },
            'aria-label': t('storyMap.form_media_delete'),
          }}
          confirmTitle={t(deleteConfirmProps.confirmTitle)}
          confirmMessage={t(deleteConfirmProps.confirmMessage)}
          confirmButton={t(deleteConfirmProps.confirmButton)}
        >
          <DeleteIcon sx={{ color: 'white' }} />
        </ConfirmButton>
      </Stack>
    );
  }
);

const getYouTubeUrl = id => `https://www.youtube.com/embed/${id}`;
const getVimeoUrl = id => `https://player.vimeo.com/video/${id}`;

const getVideoUrl = ({ id, service }) => {
  if (service === 'youtube') {
    return getYouTubeUrl(id);
  }

  if (service === 'vimeo') {
    return getVimeoUrl(id);
  }

  console.error(`Invalid video service: ${service}`);
  return null;
};

const getDataFromEmbedded = value => {
  const { id, service } = getVideoId(value);

  if (!_.includes(service, ['youtube', 'vimeo'])) {
    return null;
  }

  return {
    type: 'embedded',
    source: service,
    url: getVideoUrl({ id, service }),
  };
};

export const AddMediaDialog = memo(props => {
  const { canAdd = true, open, onClose, onAdd } = props;
  const { t } = useTranslation();
  const { addMediaFile } = useStoryMapMediaContext();

  const [currentFile, setCurrentFile] = useState();
  const [dropErrors, setDropErrors] = useState();
  const [droppedMedia, setDroppedMedia] = useState();

  const [embeddedInputValue, setEmbeddedInputValue] = useState('');
  const [embeddedMedia, setEmbeddedMedia] = useState();
  const [embeddedError, setEmbeddedError] = useState();

  const [selected, setSelected] = useState(0);

  useEffect(() => {
    if (open) {
      return;
    }

    setCurrentFile();
    setDropErrors();
    setDroppedMedia();
    setEmbeddedInputValue('');
    setEmbeddedMedia();
    setEmbeddedError();
    setSelected(0);
  }, [open]);

  const onDropRejected = useCallback(
    rejections => {
      const messages = _.flow(
        // Group by error code
        _.groupBy(_.get('errors[0].code')),
        // Get only rejected files filename and join them
        _.mapValues(_.flow(_.map(_.get('file.name')), _.join(', '))),
        _.toPairs,
        // Generate localized messages
        _.map(([errorCode, rejectedFiles]) =>
          t(
            [
              `storyMap.upload_rejected_${errorCode}`,
              `storyMap.upload_rejected`,
            ],
            { rejectedFiles }
          )
        )
      )(rejections);
      setDropErrors(() => messages);
    },
    [t, setDropErrors]
  );

  const onDrop = useCallback(
    acceptedFiles => {
      if (_.isEmpty(acceptedFiles)) {
        return;
      }
      setDropErrors(null);
      setSelected(0);

      const selectedFile = acceptedFiles[0];
      openFile(selectedFile).then(content => {
        setCurrentFile(selectedFile);

        const id = addMediaFile(content, selectedFile);

        setDroppedMedia({
          filename: selectedFile.name,
          type: selectedFile.type,
          contentId: id,
        });
      });
    },
    [addMediaFile]
  );

  const validateEmbedded = useCallback(
    value => {
      const embed = getDataFromEmbedded(value);

      if (!embed) {
        setEmbeddedError(t('storyMap.form_media_add_dialog_embedded_error'));
        setEmbeddedMedia(null);
        return;
      }
      setEmbeddedError(null);
      setEmbeddedMedia(embed);
    },
    [t]
  );

  const onEmbeddedInputChange = useCallback(
    event => {
      const value = event.target.value;
      setEmbeddedInputValue(value);
      setSelected(1);

      if (!embeddedError) {
        return;
      }

      validateEmbedded(value);
    },
    [embeddedError, validateEmbedded]
  );

  const onEmbeddedInputBlur = useCallback(() => {
    if (!embeddedInputValue) {
      return;
    }
    validateEmbedded(embeddedInputValue);
  }, [validateEmbedded, embeddedInputValue]);

  const onAddWrapper = useCallback(() => {
    const media = selected === 0 ? droppedMedia : embeddedMedia;
    onAdd(media);
  }, [selected, droppedMedia, embeddedMedia, onAdd]);

  const addDisabled = useMemo(() => {
    if (selected === 0) {
      return _.isEmpty(droppedMedia);
    }
    if (selected === 1) {
      return !_.isEmpty(embeddedError) || !embeddedInputValue;
    }
    return true;
  }, [selected, droppedMedia, embeddedError, embeddedInputValue]);

  return (
    <Dialog fullWidth open={open} onClose={onClose}>
      <DialogTitle sx={{ pb: 1 }}>
        {t('storyMap.form_media_add_dialog_title')}
      </DialogTitle>
      <DialogContent>
        <Link
          href="https://terraso.org/help/chapters/#add-media"
          target="_blank"
          rel="noopener noreferrer"
          sx={{ display: 'block', mb: 2 }}
        >
          {t('storyMap.form_media_add_dialog_help_text')}{' '}
          <OpenInNew fontSize="inherit" sx={{ verticalAlign: 'middle' }} />
        </Link>
        <DropZone
          label={
            <Stack spacing={1} sx={{ alignItems: 'center' }}>
              <CloudUploadOutlinedIcon
                sx={{ color: 'blue.dark', fontSize: 40 }}
              />
              <Typography variant="h3" sx={{ fontWeight: 500 }}>
                {t('storyMap.form_media_add_dialog_dropzone_label')}
              </Typography>
            </Stack>
          }
          multiple={false}
          caption={t('storyMap.form_media_add_dialog_dropzone_helper')}
          maxSize={STORY_MAP_MEDIA_MAX_SIZE}
          fileTypes={STORY_MAP_MEDIA_ACCEPTED_TYPES}
          fileExtensions={STORY_MAP_MEDIA_ACCEPTED_EXTENSIONS}
          onDrop={onDrop}
          onDropRejected={onDropRejected}
          errors={dropErrors}
          currentFile={currentFile}
          containerProps={{
            onClickCapture: () => setSelected(0),
            onFocusCapture: () => setSelected(0),
            sx: {
              opacity: selected === 0 ? 1 : 0.7,
            },
          }}
        />
        <Paper
          variant="outlined"
          sx={{
            p: 1,
            mt: 1,
            borderRadius: 0,
            display: 'flex',
            flexDirection: 'column',
            bgcolor: selected === 1 ? 'blue.lite' : 'white',
          }}
        >
          <Typography
            component="label"
            htmlFor="embedded-media-input"
            variant="h3"
            sx={{ fontWeight: 500, mb: 1 }}
          >
            {t('storyMap.form_media_add_dialog_link_media')}
          </Typography>
          <OutlinedInput
            id="embedded-media-input"
            size="small"
            fullWidth
            onClick={() => setSelected(1)}
            onFocus={() => setSelected(1)}
            onChange={onEmbeddedInputChange}
            onBlur={onEmbeddedInputBlur}
            value={embeddedInputValue}
            error={!!embeddedError}
            placeholder={t(
              'storyMap.form_media_add_dialog_link_media_placeholder'
            )}
          />
          {(embeddedError || !canAdd) && (
            <FormHelperText error>
              {embeddedError || t('storyMap.media_limit_reached')}
            </FormHelperText>
          )}
        </Paper>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t('common.dialog_close_label')}</Button>
        <Button
          variant="contained"
          onClick={onAddWrapper}
          disabled={addDisabled || !canAdd}
        >
          {t('storyMap.form_media_add_dialog_add')}
        </Button>
      </DialogActions>
    </Dialog>
  );
});

const EditableImage = memo(
  ({ label, image, onUpdate, onDelete, processing }) => {
    const { getMediaFile } = useStoryMapMediaContext();

    const imageSrc = useMemo(
      () => getMediaSrc(image, getMediaFile),
      [image, getMediaFile]
    );

    const deleteConfirmProps = useMemo(
      () => ({
        confirmTitle: 'storyMap.form_media_image_delete_confirm_title',
        confirmMessage: 'storyMap.form_media_image_delete_confirm_message',
        confirmButton: 'storyMap.form_media_image_delete_confirm_button',
      }),
      []
    );

    return (
      <Stack>
        <Box
          data-testid="single-image-viewport"
          sx={{
            aspectRatio: '16 / 9',
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          <CroppedImagePreview
            item={{ ...image, url: imageSrc }}
            label={label}
          />
        </Box>
        <MediaActionBar
          onUpdate={onUpdate}
          onDelete={onDelete}
          processing={processing}
          deleteConfirmProps={deleteConfirmProps}
        />
      </Stack>
    );
  }
);

const EditableAudio = memo(({ audio, onUpdate, onDelete, processing }) => {
  const { t } = useTranslation();
  const { getMediaFile } = useStoryMapMediaContext();
  const audioRef = useRef(null);

  const audioSrc = useMemo(
    () => getMediaSrc(audio, getMediaFile),
    [audio, getMediaFile]
  );

  const [containerHeight, handleAudioLoad, handleError, loadingState] =
    useMediaLoad(
      MEDIA_CONFIG[MEDIA_TYPES.AUDIO].defaultHeight,
      audioRef,
      calculateAudioHeight
    );

  const deleteConfirmProps = useMemo(
    () => ({
      confirmTitle: 'storyMap.form_media_audio_delete_confirm_title',
      confirmMessage: 'storyMap.form_media_audio_delete_confirm_message',
      confirmButton: 'storyMap.form_media_audio_delete_confirm_button',
    }),
    []
  );

  useEffect(() => {
    if (!audioRef.current || !audioSrc) {
      return;
    }

    audioRef.current.load();
  }, [audioSrc]);

  return (
    <Stack spacing={1} sx={{ height: `${containerHeight}px` }}>
      <audio
        ref={audioRef}
        style={{
          width: '100%',
          height: `${MEDIA_CONFIG[MEDIA_TYPES.AUDIO].controlsHeight}px`,
          opacity: loadingState === LOADING_STATES.ERROR ? 0.5 : 1,
        }}
        controls
        onLoadedMetadata={handleAudioLoad}
        onError={handleError}
        aria-label={`${t('storyMap.form_media_audio_label')}: ${audio.filename || t('storyMap.form_media_file_default')}`}
      >
        <source src={audioSrc} type={audio.type} />
        {t('storyMap.form_media_audio_not_supported')}
      </audio>
      {loadingState === LOADING_STATES.ERROR && (
        <Typography
          variant="caption"
          color="error"
          sx={{ textAlign: 'center' }}
        >
          {t('storyMap.form_media_audio_error')}
        </Typography>
      )}
      <MediaActionBar
        onUpdate={onUpdate}
        onDelete={onDelete}
        processing={processing}
        deleteConfirmProps={deleteConfirmProps}
      />
    </Stack>
  );
});

const EditableVideo = memo(({ video, onUpdate, onDelete, processing }) => {
  const { t } = useTranslation();
  const { getMediaFile } = useStoryMapMediaContext();
  const videoRef = useRef(null);

  const videoSrc = useMemo(
    () => getMediaSrc(video, getMediaFile),
    [video, getMediaFile]
  );

  const [containerHeight, handleVideoLoad, handleError, loadingState] =
    useMediaLoad(
      MEDIA_CONFIG[MEDIA_TYPES.VIDEO].defaultHeight,
      videoRef,
      calculateVideoHeight
    );

  const deleteConfirmProps = useMemo(
    () => ({
      confirmTitle: 'storyMap.form_media_video_delete_confirm_title',
      confirmMessage: 'storyMap.form_media_video_delete_confirm_message',
      confirmButton: 'storyMap.form_media_video_delete_confirm_button',
    }),
    []
  );

  useEffect(() => {
    if (!videoRef.current || !videoSrc) {
      return;
    }

    videoRef.current.load();
  }, [videoSrc]);

  return (
    <Stack sx={{ height: `${containerHeight}px` }}>
      <video
        ref={videoRef}
        style={{
          width: '100%',
          height: `${containerHeight - MEDIA_CONFIG[MEDIA_TYPES.VIDEO].controlsOffset}px`,
          opacity: loadingState === LOADING_STATES.ERROR ? 0.5 : 1,
        }}
        controls
        onLoadedMetadata={handleVideoLoad}
        onError={handleError}
        aria-label={`${t('storyMap.form_media_video_label')}: ${video.filename || t('storyMap.form_media_file_default')}`}
      >
        <source src={videoSrc} type={video.type} />
        {t('storyMap.form_media_video_not_supported')}
      </video>
      {loadingState === LOADING_STATES.ERROR && (
        <Typography
          variant="caption"
          color="error"
          sx={{ textAlign: 'center', py: 1 }}
        >
          {t('storyMap.form_media_video_error')}
        </Typography>
      )}
      <MediaActionBar
        onUpdate={onUpdate}
        onDelete={onDelete}
        processing={processing}
        deleteConfirmProps={deleteConfirmProps}
      />
    </Stack>
  );
});

const EditableEmbedded = memo(
  ({ label, embedded, onUpdate, onDelete, processing }) => {
    const deleteConfirmProps = useMemo(
      () => ({
        confirmTitle: 'storyMap.form_media_video_delete_confirm_title',
        confirmMessage: 'storyMap.form_media_video_delete_confirm_message',
        confirmButton: 'storyMap.form_media_video_delete_confirm_button',
      }),
      []
    );

    return (
      <Stack spacing={1}>
        <iframe
          allowFullScreen
          title={embedded.title || label}
          src={embedded.url}
          style={{
            height: `${MEDIA_CONFIG[MEDIA_TYPES.EMBEDDED].defaultHeight}px`,
            width: '100%',
          }}
          loading="lazy"
        />
        <MediaActionBar
          onUpdate={onUpdate}
          onDelete={onDelete}
          processing={processing}
          deleteConfirmProps={deleteConfirmProps}
        />
      </Stack>
    );
  }
);

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

const ImageCropDialog = ({ image, onClose, onSave }) => {
  const { getMediaFile } = useStoryMapMediaContext();
  const [altText, setAltText] = useState(image.altText || '');
  const [crop, setCrop] = useState(image.crop || DEFAULT_CROP);
  const [fitScale, setFitScale] = useState(image.crop?.fitScale || 1);
  const imageSrc = getMediaSrc(image, getMediaFile);

  return (
    <Dialog
      fullWidth
      maxWidth="md"
      open
      onClose={onClose}
      slotProps={{ paper: { 'aria-label': i18n.t('storyMap.media_crop') } }}
    >
      <DialogContent>
        <Stack spacing={2} sx={{ alignItems: 'center', pt: 1 }}>
          <Box sx={{ maxWidth: '100%', overflow: 'hidden' }}>
            <img
              alt={i18n.t('storyMap.media_crop_source')}
              onLoad={({ currentTarget }) => {
                const nextFitScale = calculateFitScale(currentTarget);
                setFitScale(nextFitScale);
                setCrop(currentCrop => ({
                  ...currentCrop,
                  scale: Math.max(currentCrop.scale, nextFitScale),
                }));
              }}
              src={imageSrc}
              style={{ display: 'none' }}
            />
            <AvatarEditor
              style={{ maxWidth: '100%', height: 'auto' }}
              image={imageSrc}
              width={640}
              height={640 / CAROUSEL_ASPECT_RATIO}
              border={20}
              color={[255, 255, 255, 0.6]}
              position={crop.position}
              scale={Math.max(crop.scale, fitScale)}
              onPositionChange={position =>
                setCrop(currentCrop => ({ ...currentCrop, position }))
              }
            />
          </Box>
          <Stack
            direction="row"
            spacing={2}
            sx={{ alignItems: 'center', width: '100%' }}
          >
            <Typography id="carousel-crop-zoom-label">
              {i18n.t('storyMap.media_zoom')}
            </Typography>
            <Slider
              aria-labelledby="carousel-crop-zoom-label"
              min={fitScale}
              max={3}
              step={0.1}
              value={crop.scale}
              valueLabelDisplay="auto"
              valueLabelFormat={scale =>
                scale === fitScale
                  ? i18n.t('storyMap.media_fit_image')
                  : `${scale}x`
              }
              onChange={(event, scale) =>
                setCrop(currentCrop => ({ ...currentCrop, scale }))
              }
            />
          </Stack>
          <OutlinedInput
            fullWidth
            inputProps={{
              maxLength: 1000,
              'aria-label': i18n.t('storyMap.media_alt_placeholder'),
            }}
            multiline
            onChange={event => setAltText(event.target.value)}
            placeholder={i18n.t('storyMap.media_alt_placeholder')}
            rows={3}
            value={altText}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{i18n.t('storyMap.media_cancel')}</Button>
        <Button
          variant="contained"
          onClick={() => onSave(crop, altText.trim())}
        >
          {i18n.t('storyMap.media_done')}
        </Button>
      </DialogActions>
    </Dialog>
  );
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

const EditableMediaList = ({
  onChange,
  onPresentationChange,
  presentation,
  value,
}) => {
  const { t } = useTranslation();
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
          crop,
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

const EditableSingleMedia = memo(({ label, value, onChange }) => {
  const [open, setOpen] = useState(false);

  const onAdd = useCallback(
    media => {
      onChange(media);
      setOpen(false);
    },
    [onChange]
  );

  const onDelete = useCallback(() => {
    onChange(null);
  }, [onChange]);

  const onClose = useCallback(() => setOpen(false), []);
  const onOpen = useCallback(() => setOpen(true), []);

  const renderMediaComponent = useMemo(() => {
    if (!value) {
      return null;
    }

    const commonProps = {
      label,
      onUpdate: onOpen,
      onDelete,
    };

    if (value.type.startsWith(MEDIA_TYPES.IMAGE)) {
      return <EditableImage image={value} {...commonProps} />;
    }
    if (value.type.startsWith(MEDIA_TYPES.AUDIO)) {
      return <EditableAudio audio={value} {...commonProps} />;
    }
    if (value.type.startsWith(MEDIA_TYPES.VIDEO)) {
      return <EditableVideo video={value} {...commonProps} />;
    }
    if (value.type.startsWith(MEDIA_TYPES.EMBEDDED)) {
      return <EditableEmbedded embedded={value} {...commonProps} />;
    }
    return null;
  }, [value, label, onOpen, onDelete]);

  return (
    <>
      {open && <AddMediaDialog open={open} onClose={onClose} onAdd={onAdd} />}
      {renderMediaComponent}
      {!value && <EmptyMediaPlaceholder onUpload={onOpen} />}
    </>
  );
});

const EditableMedia = ({
  label,
  multiple = false,
  onChange,
  onPresentationChange,
  presentation = 'carousel',
  value,
}) =>
  multiple ? (
    <EditableMediaList
      label={label}
      onChange={onChange}
      onPresentationChange={onPresentationChange}
      presentation={presentation}
      value={value}
    />
  ) : (
    <EditableSingleMedia label={label} value={value} onChange={onChange} />
  );

export default memo(EditableMedia);
