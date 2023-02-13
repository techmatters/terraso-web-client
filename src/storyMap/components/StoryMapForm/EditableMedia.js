// Component for editing and uploading a pictures or a audio file
import React, { useCallback, useEffect, useMemo, useState } from 'react';

import _ from 'lodash/fp';
import { openFile } from 'media/fileUtils';
import { Trans, useTranslation } from 'react-i18next';
import { v4 as uuidv4 } from 'uuid';

import DeleteIcon from '@mui/icons-material/Delete';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormHelperText,
  OutlinedInput,
  Paper,
  Radio,
  Stack,
  Typography,
} from '@mui/material';

import ConfirmButton from 'common/components/ConfirmButton';
import DropZone from 'common/components/DropZone';

import {
  STORY_MAP_MEDIA_ACCEPTED_EXTENSIONS,
  STORY_MAP_MEDIA_ACCEPTED_TYPES,
  STORY_MAP_MEDIA_MAX_SIZE,
} from 'config';

import { useConfigContext } from './configContext';

import theme from 'theme';

const VIMEO_REGEX = /^https:\/\/player\.vimeo\.com\/video\/\d+\?\w+=\w+$/;
const YOUTUBE_REGEX = /^https:\/\/www\.youtube\.com\/embed\/\w+$/;

const getDataFromEmbedded = value => {
  const parser = new DOMParser();
  const htmlDoc = parser.parseFromString(value, 'text/html');
  const element = htmlDoc.getElementsByTagName('iframe')[0];
  const isIframe = element && element.src;

  const url = isIframe ? element.src : value;
  const title = isIframe ? element.title : '';

  const isVimeo = VIMEO_REGEX.test(url);
  const isYoutube = YOUTUBE_REGEX.test(url);

  if (!isVimeo && !isYoutube) {
    return null;
  }

  return {
    type: 'embedded',
    source: isVimeo ? 'vimeo' : 'youtube',
    url,
    title,
  };
};

const AddDialog = props => {
  const { t } = useTranslation();
  const { open, onClose, onAdd } = props;

  const [currentFile, setCurrentFile] = useState();
  const [dropError, setDropError] = useState();
  const [droppedMedia, setDroppedMedia] = useState();

  const [embeddedInputValue, setEmbeddedInputValue] = useState('');
  const [embeddedMedia, setEmbeddedMedia] = useState();
  const [embeddedError, setEmbeddedError] = useState();

  const [selected, setSelected] = useState(0);
  const { addMediaFile } = useConfigContext();

  const onDrop = useCallback(
    acceptedFiles => {
      if (_.isEmpty(acceptedFiles)) {
        setDropError(t('landscape.boundaries_file_no_accepted'));
        return;
      }
      setDropError(null);
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
    [t, addMediaFile]
  );

  const dropErrors = useMemo(() => (dropError ? [dropError] : []), [dropError]);

  const onEmbeddedInputChange = useCallback(
    event => {
      const value = event.target.value;
      setEmbeddedInputValue(value);
      setSelected(1);

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
      return _.isEmpty(embeddedMedia);
    }
    return true;
  }, [selected, droppedMedia, embeddedMedia]);

  return (
    <Dialog fullWidth open={open} onClose={onClose}>
      <DialogTitle>{t('storyMap.form_media_add_dialog_title')}</DialogTitle>
      <DialogContent>
        <Radio
          name="radio-selected"
          checked={selected === 0}
          value={0}
          onChange={onRadioChange}
          sx={{ float: 'left' }}
        />
        <DropZone
          maxSize={STORY_MAP_MEDIA_MAX_SIZE}
          fileTypes={STORY_MAP_MEDIA_ACCEPTED_TYPES}
          fileExtensions={STORY_MAP_MEDIA_ACCEPTED_EXTENSIONS}
          onDrop={onDrop}
          errors={dropErrors}
          currentFile={currentFile}
          containerProps={{
            sx: {
              ...(selected === 0 ? selectedSx : notSelectedSx),
            },
          }}
        />
        <Radio
          name="radio-selected"
          checked={selected === 1}
          value={1}
          onChange={onRadioChange}
          sx={{ float: 'left' }}
        />
        <Paper
          variant="outlined"
          sx={{
            p: 2,
            mt: 1,
            borderRadius: 0,
            display: 'flex',
            flexDirection: 'column',
            ...(selected === 1 ? selectedSx : notSelectedSx),
          }}
        >
          <Typography sx={{ mb: 1 }}>
            {t('storyMap.form_media_add_dialog_link_media')}
          </Typography>
          <OutlinedInput
            size="small"
            fullWidth
            onChange={onEmbeddedInputChange}
            value={embeddedInputValue}
            error={!!embeddedError}
          />
          {embeddedError && (
            <FormHelperText error>{embeddedError}</FormHelperText>
          )}
        </Paper>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>
          {t('storyMap.form_media_add_dialog_close')}
        </Button>
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
  const { getMediaFile } = useConfigContext();
  const { image, onUpdate, onDelete, processing } = props;

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
    <Stack
      sx={{
        position: 'relative',
      }}
    >
      <img src={imageSrc} alt="TODO" style={{ width: '100%' }} />
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
              backgroundColor: palette.blue.background,
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

const EditableAudio = props => {
  const { t } = useTranslation();
  const [id, setId] = useState(0);
  const { getMediaFile } = useConfigContext();
  const { audio, onUpdate, onDelete, processing } = props;

  useEffect(() => {
    setId(uuidv4());
  }, [audio]);

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
      <audio key={id} style={{ width: '100%' }} controls>
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
              backgroundColor: palette.blue.background,
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
};

const EditableEmbedded = props => {
  const { t } = useTranslation();
  const { onUpdate, onDelete, embedded, processing } = props;

  return (
    <Stack spacing={1}>
      <iframe
        title={embedded.title}
        src={embedded.url}
        frameborder="0"
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
              backgroundColor: palette.blue.background,
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
};

const EditableMedia = props => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const { value, onChange } = props;

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
      <AddDialog open={open} onClose={onClose} onAdd={onAdd} />
      {value &&
        (value.type.startsWith('image') ? (
          <EditableImage image={value} onUpdate={onOpen} onDelete={onDelete} />
        ) : value.type.startsWith('audio') ? (
          <EditableAudio audio={value} onUpdate={onOpen} onDelete={onDelete} />
        ) : value.type.startsWith('embedded') ? (
          <EditableEmbedded
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
          <Trans i18nKey="storyMap.form_media_placeholder">
            <Typography variant="h3" sx={{ pt: 0 }}>
              Title
            </Typography>
            <Typography variant="caption" sx={{ textAlign: 'center' }}>
              Description
            </Typography>
          </Trans>
          <Button variant="outlined" onClick={onOpen}>
            {t('storyMap.form_media_upload')}
          </Button>
        </Stack>
      )}
    </>
  );
};

export default EditableMedia;
