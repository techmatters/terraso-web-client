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
import _ from 'lodash/fp';
import AvatarEditor from 'react-avatar-editor';
import { useTranslation } from 'react-i18next';
import AddIcon from '@mui/icons-material/Add';
import CropIcon from '@mui/icons-material/Crop';
import DeleteIcon from '@mui/icons-material/Delete';
import GridViewOutlinedIcon from '@mui/icons-material/GridViewOutlined';
import KeyboardDoubleArrowLeftIcon from '@mui/icons-material/KeyboardDoubleArrowLeft';
import KeyboardDoubleArrowRightIcon from '@mui/icons-material/KeyboardDoubleArrowRight';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import ViewCarouselOutlinedIcon from '@mui/icons-material/ViewCarouselOutlined';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  FormHelperText,
  IconButton,
  ListItemIcon,
  Menu,
  MenuItem,
  OutlinedInput,
  Paper,
  Radio,
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
  GalleryPresentation,
} from 'terraso-web-client/storyMap/components/StoryMapMediaPoc';
import {
  getResolvedStoryMapTheme,
  getStoryMapThemeCssVariables,
} from 'terraso-web-client/storyMap/storyMapThemeUtils';

import {
  STORY_MAP_MEDIA_ACCEPTED_EXTENSIONS,
  STORY_MAP_MEDIA_ACCEPTED_TYPES,
  STORY_MAP_MEDIA_MAX_SIZE,
} from 'terraso-web-client/config';

import theme from 'terraso-web-client/theme';

const MEDIA_TYPES = {
  IMAGE: 'image',
  AUDIO: 'audio',
  VIDEO: 'video',
  EMBEDDED: 'embedded',
};

const CAROUSEL_ASPECT_RATIO = 16 / 9;
const DEFAULT_CROP = { position: { x: 0.5, y: 0.5 }, scale: 1 };

const calculateFitScale = ({ naturalHeight, naturalWidth }) => {
  if (!naturalHeight || !naturalWidth) {
    return 1;
  }

  const imageAspectRatio = naturalWidth / naturalHeight;
  return Math.min(
    imageAspectRatio / CAROUSEL_ASPECT_RATIO,
    CAROUSEL_ASPECT_RATIO / imageAspectRatio
  );
};

const MEDIA_CONFIG = {
  [MEDIA_TYPES.IMAGE]: {
    defaultHeight: 250,
    minHeight: 200,
    maxHeight: 400,
  },
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

const getMediaSrc = (media, getMediaFile) => {
  if (media.signedUrl) {
    return media.signedUrl;
  }
  if (media.contentId) {
    return getMediaFile(media.contentId);
  }
  return media.url || null;
};

// Calculate media height to avoid scroller jumps in story map editor
// This is needed because media elements are loaded asynchronously
const calculateImageHeight = imgElement => {
  if (!imgElement || !imgElement.naturalWidth || !imgElement.naturalHeight) {
    return MEDIA_CONFIG[MEDIA_TYPES.IMAGE].defaultHeight;
  }

  const aspectRatio = imgElement.naturalHeight / imgElement.naturalWidth;
  const config = MEDIA_CONFIG[MEDIA_TYPES.IMAGE];
  return Math.max(
    config.minHeight,
    Math.min(config.maxHeight, imgElement.offsetWidth * aspectRatio)
  );
};

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

const AddSectionTitle = memo(({ checked, value, onChange, label, labelId }) => (
  <FormControlLabel
    sx={{ width: '100%', ml: 0, mr: 0 }}
    onClick={event => event.stopPropagation()}
    control={
      <Radio
        name="add-media-radio-selected"
        checked={checked}
        value={value}
        onChange={onChange}
      />
    }
    label={
      <Typography
        id={labelId}
        variant="h3"
        sx={{
          width: '100%',
          p: 0,
          fontWeight: 500,
        }}
      >
        {label}
      </Typography>
    }
  />
));

export const AddMediaDialog = memo(({ open, onClose, onAdd }) => {
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

  const onRadioChange = useCallback(event => {
    setSelected(_.toNumber(event.target.value));
  }, []);

  const onAddWrapper = useCallback(() => {
    const media = selected === 0 ? droppedMedia : embeddedMedia;
    onAdd(media);
  }, [selected, droppedMedia, embeddedMedia, onAdd]);

  const selectedSx = useMemo(
    () => ({
      bgcolor: 'blue.lite',
      border: `2px solid ${theme.palette.blue.dark}`,
    }),
    []
  );
  const notSelectedSx = useMemo(
    () => ({
      bgcolor: 'white',
      border: `1px solid ${theme.palette.gray.lite1}`,
    }),
    []
  );

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
      <DialogTitle>{t('storyMap.form_media_add_dialog_title')}</DialogTitle>
      <DialogContent>
        <DropZone
          label={
            <AddSectionTitle
              checked={selected === 0}
              value={0}
              onChange={onRadioChange}
              label={t('storyMap.form_media_add_dialog_dropzone_label')}
            />
          }
          maxSize={STORY_MAP_MEDIA_MAX_SIZE}
          fileTypes={STORY_MAP_MEDIA_ACCEPTED_TYPES}
          fileExtensions={STORY_MAP_MEDIA_ACCEPTED_EXTENSIONS}
          onDrop={onDrop}
          onDropRejected={onDropRejected}
          errors={dropErrors}
          currentFile={currentFile}
          containerProps={{
            sx: {
              ...(selected === 0 ? selectedSx : notSelectedSx),
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
            ...(selected === 1 ? selectedSx : notSelectedSx),
          }}
        >
          <AddSectionTitle
            labelId="embedded-media-label"
            checked={selected === 1}
            value={1}
            onChange={onRadioChange}
            label={t('storyMap.form_media_add_dialog_link_media')}
          />
          <OutlinedInput
            inputProps={{
              'aria-labelledby': 'embedded-media-label',
            }}
            size="small"
            fullWidth
            onClick={() => setSelected(1)}
            onChange={onEmbeddedInputChange}
            onBlur={onEmbeddedInputBlur}
            value={embeddedInputValue}
            error={!!embeddedError}
            placeholder={t(
              'storyMap.form_media_add_dialog_link_media_placeholder'
            )}
          />
          {embeddedError && (
            <FormHelperText error>{embeddedError}</FormHelperText>
          )}
        </Paper>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t('common.dialog_close_label')}</Button>
        <Button
          variant="contained"
          onClick={onAddWrapper}
          disabled={addDisabled}
        >
          {t('storyMap.form_media_add_dialog_add')}
        </Button>
      </DialogActions>
    </Dialog>
  );
});

const EditableImage = memo(
  ({ label, image, onUpdate, onDelete, processing }) => {
    const { t } = useTranslation();
    const { getMediaFile } = useStoryMapMediaContext();
    const imageRef = useRef(null);

    const imageSrc = useMemo(
      () => getMediaSrc(image, getMediaFile),
      [image, getMediaFile]
    );

    const [containerHeight, handleImageLoad, handleError, loadingState] =
      useMediaLoad(
        MEDIA_CONFIG[MEDIA_TYPES.IMAGE].defaultHeight,
        imageRef,
        calculateImageHeight
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
      <Stack sx={{ position: 'relative', height: `${containerHeight}px` }}>
        <img
          ref={imageRef}
          src={imageSrc}
          alt={label}
          onLoad={handleImageLoad}
          onError={handleError}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            opacity: loadingState === LOADING_STATES.ERROR ? 0.5 : 1,
          }}
          loading="lazy"
        />
        {loadingState === LOADING_STATES.ERROR && (
          <Stack
            sx={{
              justifyContent: 'center',
              alignItems: 'center',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.3)',
              color: 'white',
            }}
          >
            <Typography variant="body2">
              {t('storyMap.form_media_image_error')}
            </Typography>
          </Stack>
        )}
        <Stack
          sx={{
            position: 'absolute',
            bottom: 0,
            width: '100%',
          }}
        >
          <MediaActionBar
            onUpdate={onUpdate}
            onDelete={onDelete}
            processing={processing}
            deleteConfirmProps={deleteConfirmProps}
          />
        </Stack>
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

const mediaLabel = (media, index) =>
  `${media.type.split('/')[0]} media ${index + 1}`;

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
  const [crop, setCrop] = useState(image.crop || DEFAULT_CROP);
  const [fitScale, setFitScale] = useState(image.crop?.fitScale || 1);
  const imageSrc = getMediaSrc(image, getMediaFile);

  return (
    <Dialog fullWidth maxWidth="md" open onClose={onClose}>
      <DialogTitle>Crop carousel image</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ alignItems: 'center', pt: 1 }}>
          <Box sx={{ maxWidth: '100%', overflow: 'hidden' }}>
            <img
              alt="Crop source"
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
            <Typography id="carousel-crop-zoom-label">Zoom</Typography>
            <Slider
              aria-labelledby="carousel-crop-zoom-label"
              min={fitScale}
              max={3}
              step={0.1}
              value={crop.scale}
              valueLabelDisplay="auto"
              valueLabelFormat={scale =>
                scale === fitScale ? 'Fit image' : `${scale}x`
              }
              onChange={(event, scale) =>
                setCrop(currentCrop => ({ ...currentCrop, scale }))
              }
            />
          </Stack>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={() => onSave(crop)}>
          Apply crop
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const AddMediaButton = ({ compact = false, onClick }) => (
  <Tooltip title="Add media">
    <Button
      aria-label="Add media"
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
      variant="outlined"
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
        Add media
      </Box>
    </Button>
  </Tooltip>
);

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
        aria-label={`Actions for ${label}`}
        onClick={event => {
          event.stopPropagation();
          setAnchorElement(event.currentTarget);
        }}
        size="small"
        sx={{
          bgcolor: 'rgba(33, 33, 33, 0.88)',
          color: 'white',
          height: 32,
          width: 32,
          '&:hover': { bgcolor: 'rgba(33, 33, 33, 0.96)' },
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
              Crop
            </Typography>
          </MenuItem>
        )}
        <MenuItem
          disabled={!canMoveEarlier}
          onClick={runAction(onMoveEarlier)}
          sx={{ minHeight: 44, px: 1.5 }}
        >
          <ListItemIcon sx={{ minWidth: 28 }}>
            <KeyboardDoubleArrowLeftIcon sx={{ fontSize: 18 }} />
          </ListItemIcon>
          <Typography
            component="span"
            sx={{ fontSize: 14, lineHeight: '20px' }}
          >
            Move earlier
          </Typography>
        </MenuItem>
        <MenuItem
          disabled={!canMoveLater}
          onClick={runAction(onMoveLater)}
          sx={{ minHeight: 44, px: 1.5 }}
        >
          <ListItemIcon sx={{ minWidth: 28 }}>
            <KeyboardDoubleArrowRightIcon sx={{ fontSize: 18 }} />
          </ListItemIcon>
          <Typography
            component="span"
            sx={{ fontSize: 14, lineHeight: '20px' }}
          >
            Move later
          </Typography>
        </MenuItem>
        <ConfirmButton
          ariaLabel="Delete"
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
            Delete
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
    '&.Mui-disabled': { color: 'rgba(255, 255, 255, 0.45)' },
  };

  return (
    <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
      {onCrop && (
        <Tooltip placement="top" title={`Crop ${label}`}>
          <IconButton
            aria-label={`Crop ${label}`}
            onClick={onCrop}
            size="small"
            sx={actionButtonSx}
          >
            <CropIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      )}
      <Tooltip placement="top" title="Move earlier">
        <span>
          <IconButton
            aria-label={`Move ${label} earlier`}
            disabled={!canMoveEarlier}
            onClick={onMoveEarlier}
            size="small"
            sx={actionButtonSx}
          >
            <KeyboardDoubleArrowLeftIcon fontSize="small" />
          </IconButton>
        </span>
      </Tooltip>
      <Tooltip placement="top" title="Move later">
        <span>
          <IconButton
            aria-label={`Move ${label} later`}
            disabled={!canMoveLater}
            onClick={onMoveLater}
            size="small"
            sx={actionButtonSx}
          >
            <KeyboardDoubleArrowRightIcon fontSize="small" />
          </IconButton>
        </span>
      </Tooltip>
      <ConfirmButton
        ariaLabel={`Remove ${label}`}
        buttonProps={{ sx: { ...actionButtonSx, minWidth: 36, p: 0 } }}
        confirmButton={t(deleteConfirmProps.button)}
        confirmButtonDestructive
        confirmMessage={t(deleteConfirmProps.message)}
        confirmTitle={t(deleteConfirmProps.title)}
        onConfirm={onDelete}
        tooltip={`Remove ${label}`}
        tooltipPlacement="top"
        variant="text"
      >
        <DeleteIcon fontSize="small" />
      </ConfirmButton>
    </Stack>
  );
};

const EditableMediaList = ({
  label,
  onChange,
  onPresentationChange,
  presentation,
  value,
}) => {
  const { t } = useTranslation();
  const { config } = useStoryMapConfigDataContext();
  const [cropIndex, setCropIndex] = useState(null);
  const [open, setOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const mediaItems = value || [];
  const carouselThemeStyles = useMemo(
    () => getStoryMapThemeCssVariables(config),
    [config]
  );
  const carouselTheme = useMemo(
    () => getResolvedStoryMapTheme(config),
    [config]
  );
  const selectedMedia = mediaItems[selectedIndex];
  const Presentation =
    presentation === 'gallery' ? GalleryPresentation : CarouselPresentation;

  const updateCrop = crop => {
    onChange(
      mediaItems.map((media, index) =>
        index === cropIndex ? { ...media, crop } : media
      )
    );
    setCropIndex(null);
  };

  const moveMediaAtIndex = (index, direction) => {
    const nextIndex = index + direction;
    onChange(moveMedia(mediaItems, index, direction));
    setSelectedIndex(nextIndex);
  };

  const removeMediaAtIndex = index => {
    onChange(mediaItems.filter((media, mediaIndex) => mediaIndex !== index));
    setSelectedIndex(index =>
      Math.max(0, Math.min(index, mediaItems.length - 2))
    );
  };

  return (
    <Stack spacing={2}>
      {open && (
        <AddMediaDialog
          open={open}
          onClose={() => setOpen(false)}
          onAdd={media => {
            const nextMedia = {
              ...media,
              id: media.contentId || media.url,
            };
            onChange([...mediaItems, nextMedia]);
            setOpen(false);
          }}
        />
      )}
      {!mediaItems.length && (
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
            Upload or link images, audio recordings or video files.
          </Typography>
          <Button variant="outlined" onClick={() => setOpen(true)}>
            Add media
          </Button>
        </Stack>
      )}
      {mediaItems.length === 1 && (
        <Stack spacing={1}>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <AddMediaButton onClick={() => setOpen(true)} />
          </Box>
          <EditableSingleMedia
            label={label}
            onChange={media => onChange(media ? [media] : [])}
            value={mediaItems[0]}
          />
        </Stack>
      )}
      {mediaItems.length > 1 && (
        <Stack spacing={1}>
          <Presentation
            currentIndex={selectedIndex}
            footerAction={
              <AddMediaButton compact onClick={() => setOpen(true)} />
            }
            items={mediaItems}
            navigationColor="#212121"
            onCurrentIndexChange={setSelectedIndex}
            presentationAction={
              <ToggleButtonGroup
                aria-label="Display media as"
                exclusive
                onChange={(_event, nextPresentation) => {
                  if (nextPresentation) {
                    onPresentationChange(nextPresentation);
                  }
                }}
                size="small"
                value={presentation}
              >
                <Tooltip placement="top" title="Display as carousel">
                  <ToggleButton
                    aria-label="Display as carousel"
                    sx={{ height: 32, minWidth: 36, p: 0.5, width: 36 }}
                    value="carousel"
                  >
                    <ViewCarouselOutlinedIcon fontSize="small" />
                  </ToggleButton>
                </Tooltip>
                <Tooltip placement="top" title="Display as gallery">
                  <ToggleButton
                    aria-label="Display as gallery"
                    sx={{ height: 32, minWidth: 36, p: 0.5, width: 36 }}
                    value="gallery"
                  >
                    <GridViewOutlinedIcon fontSize="small" />
                  </ToggleButton>
                </Tooltip>
              </ToggleButtonGroup>
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
                onMoveEarlier: () => moveMediaAtIndex(index, -1),
                onMoveLater: () => moveMediaAtIndex(index, 1),
              };

              if (actionPresentation === 'toolbar') {
                return <MediaActionsToolbar {...actionProps} />;
              }

              return <MediaActionsMenu {...actionProps} />;
            }}
          />
        </Stack>
      )}
      {cropIndex !== null && (
        <ImageCropDialog
          image={mediaItems[cropIndex]}
          onClose={() => setCropIndex(null)}
          onSave={updateCrop}
        />
      )}
    </Stack>
  );
};

const EditableSingleMedia = memo(({ label, value, onChange }) => {
  const { t } = useTranslation();
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
      {!value && (
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
          <Button variant="outlined" onClick={onOpen}>
            {t('storyMap.form_media_upload')}
          </Button>
        </Stack>
      )}
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
