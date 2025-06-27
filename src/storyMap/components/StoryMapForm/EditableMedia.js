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
import React, { useCallback, useMemo, useState } from 'react';
import getVideoId from 'get-video-id';
import _ from 'lodash/fp';
import { openFile } from 'media/fileUtils';
import { useTranslation } from 'react-i18next';
import DeleteIcon from '@mui/icons-material/Delete';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  FormHelperText,
  OutlinedInput,
  Paper,
  Radio,
  Stack,
  Typography,
} from '@mui/material';

import ConfirmButton from 'common/components/ConfirmButton';
import DropZone from 'common/components/DropZone';

import { useStoryMapConfigContext } from './storyMapConfigContext';

import {
  STORY_MAP_MEDIA_ACCEPTED_EXTENSIONS,
  STORY_MAP_MEDIA_ACCEPTED_TYPES,
  STORY_MAP_MEDIA_MAX_SIZE,
} from 'config';

import theme from 'theme';

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

const AddSectionTitle = props => {
  const { checked, value, onChange, label, labelId } = props;
  return (
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
  );
};

const AddDialog = props => {
  const { t } = useTranslation();
  const { open, onClose, onAdd } = props;

  const [currentFile, setCurrentFile] = useState();
  const [dropErrors, setDropErrors] = useState();
  const [droppedMedia, setDroppedMedia] = useState();

  const [embeddedInputValue, setEmbeddedInputValue] = useState('');
  const [embeddedMedia, setEmbeddedMedia] = useState();
  const [embeddedError, setEmbeddedError] = useState();

  const [selected, setSelected] = useState(0);
  const { addMediaFile } = useStoryMapConfigContext();

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
};

const EditableImage = props => {
  const { t } = useTranslation();
  const { getMediaFile } = useStoryMapConfigContext();
  const { label, image, onUpdate, onDelete, processing } = props;

  const imageSrc = useMemo(() => {
    if (image.signedUrl) {
      return image.signedUrl;
    }
    if (image.contentId) {
      return getMediaFile(image.contentId);
    }
    return null;
  }, [image, getMediaFile]);

  return (
    <Stack sx={{ position: 'relative' }}>
      <img src={imageSrc} alt={label} style={{ width: '100%' }} />
      <Stack
        justifyContent="center"
        alignItems="center"
        direction="row"
        sx={{
          color: 'white',
          background: 'rgba(0,0,0,0.5)',
          position: 'absolute',
          bottom: 0,
          width: '100%',
          pt: 2,
          pb: 2,
        }}
        spacing={1}
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
        >
          {t('storyMap.form_media_update_label')}
        </Button>
        <ConfirmButton
          onConfirm={onDelete}
          loading={processing}
          variant="text"
          buttonProps={{
            title: t('storyMap.form_media_delete_label'),
            sx: {
              minWidth: 'auto',
            },
          }}
          confirmTitle={t('storyMap.form_media_image_delete_confirm_title')}
          confirmMessage={t('storyMap.form_media_image_delete_confirm_message')}
          confirmButton={t('storyMap.form_media_image_delete_confirm_button')}
        >
          <DeleteIcon sx={{ color: 'white' }} />
        </ConfirmButton>
      </Stack>
    </Stack>
  );
};

const EditableAudio = React.memo(props => {
  const { t } = useTranslation();
  const { getMediaFile } = useStoryMapConfigContext();
  const { audio, onUpdate, onDelete, processing } = props;

  const audioSrc = useMemo(() => {
    if (audio.signedUrl) {
      return audio.signedUrl;
    }
    if (audio.contentId) {
      return getMediaFile(audio.contentId);
    }
    return null;
  }, [audio, getMediaFile]);

  return (
    <Stack spacing={1}>
      {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
      <audio style={{ width: '100%' }} controls>
        <source src={audioSrc} type={audio.type} />
        {t('storyMap.form_media_audio_not_supported')}
      </audio>
      <Stack
        justifyContent="center"
        alignItems="center"
        direction="row"
        sx={{
          color: 'white',
          background: 'rgba(0,0,0,0.5)',
          width: '100%',
          pt: 2,
          pb: 2,
        }}
        spacing={1}
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
        >
          {t('storyMap.form_media_update_label')}
        </Button>
        <ConfirmButton
          onConfirm={onDelete}
          loading={processing}
          variant="text"
          buttonProps={{
            title: t('storyMap.form_media_delete_label'),
            sx: {
              minWidth: 'auto',
            },
          }}
          confirmTitle={t('storyMap.form_media_audio_delete_confirm_title')}
          confirmMessage={t('storyMap.form_media_audio_delete_confirm_message')}
          confirmButton={t('storyMap.form_media_audio_delete_confirm_button')}
        >
          <DeleteIcon sx={{ color: 'white' }} />
        </ConfirmButton>
      </Stack>
    </Stack>
  );
});

const EditableVideo = React.memo(props => {
  const { t } = useTranslation();
  const { getMediaFile } = useStoryMapConfigContext();
  const { video, onUpdate, onDelete, processing } = props;

  const videoSrc = useMemo(() => {
    if (video.signedUrl) {
      return video.signedUrl;
    }
    if (video.contentId) {
      return getMediaFile(video.contentId);
    }
    return null;
  }, [video, getMediaFile]);

  return (
    <Stack>
      {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
      <video style={{ width: '100%' }} controls>
        <source src={videoSrc} type={video.type} />
        {t('storyMap.form_media_video_not_supported')}
      </video>
      <Stack
        justifyContent="center"
        alignItems="center"
        direction="row"
        sx={{
          color: 'white',
          background: 'rgba(0,0,0,0.5)',
          bottom: 0,
          width: '100%',
          pt: 2,
          pb: 2,
        }}
        spacing={1}
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
        >
          {t('storyMap.form_media_update_label')}
        </Button>
        <ConfirmButton
          onConfirm={onDelete}
          loading={processing}
          variant="text"
          buttonProps={{
            title: t('storyMap.form_media_delete_label'),
            sx: {
              minWidth: 'auto',
            },
          }}
          confirmTitle={t('storyMap.form_media_video_delete_confirm_title')}
          confirmMessage={t('storyMap.form_media_video_delete_confirm_message')}
          confirmButton={t('storyMap.form_media_video_delete_confirm_button')}
        >
          <DeleteIcon sx={{ color: 'white' }} />
        </ConfirmButton>
      </Stack>
    </Stack>
  );
});

const EditableEmbedded = props => {
  const { t } = useTranslation();
  const { onUpdate, onDelete, embedded, processing } = props;

  return (
    <Stack spacing={1}>
      <iframe
        allowFullScreen
        title={embedded.title}
        src={embedded.url}
        style={{ height: '300px', width: '100%' }}
      />
      <Stack
        justifyContent="center"
        alignItems="center"
        direction="row"
        sx={{
          color: 'white',
          background: 'rgba(0,0,0,0.5)',
          width: '100%',
          pt: 2,
          pb: 2,
        }}
        spacing={1}
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
        >
          {t('storyMap.form_media_update_label')}
        </Button>
        <ConfirmButton
          onConfirm={onDelete}
          loading={processing}
          variant="text"
          buttonProps={{
            title: t('storyMap.form_media_delete_label'),
            sx: {
              minWidth: 'auto',
            },
          }}
          confirmTitle={t('storyMap.form_media_video_delete_confirm_title')}
          confirmMessage={t('storyMap.form_media_video_delete_confirm_message')}
          confirmButton={t('storyMap.form_media_video_delete_confirm_button')}
        >
          <DeleteIcon sx={{ color: 'white' }} />
        </ConfirmButton>
      </Stack>
    </Stack>
  );
};

const EditableMedia = React.memo(props => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const { label, value, onChange } = props;

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

  return (
    <>
      {open && <AddDialog open={open} onClose={onClose} onAdd={onAdd} />}
      {value &&
        (value.type.startsWith('image') ? (
          <EditableImage
            label={label}
            image={value}
            onUpdate={onOpen}
            onDelete={onDelete}
          />
        ) : value.type.startsWith('audio') ? (
          <EditableAudio
            label={label}
            audio={value}
            onUpdate={onOpen}
            onDelete={onDelete}
          />
        ) : value.type.startsWith('video') ? (
          <EditableVideo video={value} onUpdate={onOpen} onDelete={onDelete} />
        ) : value.type.startsWith('embedded') ? (
          <EditableEmbedded
            label={label}
            embedded={value}
            onUpdate={onOpen}
            onDelete={onDelete}
          />
        ) : null)}
      {!value && (
        <Stack
          alignItems="center"
          justifyContent="center"
          spacing={2}
          component={Paper}
          sx={{ bgcolor: 'blue.mid', minHeight: 150, p: 2 }}
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

export default EditableMedia;
