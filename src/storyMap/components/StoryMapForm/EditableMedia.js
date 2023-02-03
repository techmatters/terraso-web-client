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
  Paper,
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

const AddDialog = props => {
  const { t } = useTranslation();
  const { open, onClose, onAdd } = props;
  const [currentFile, setCurrentFile] = useState();
  const [dropError, setDropError] = useState();
  const [media, setMedia] = useState();

  const onDrop = useCallback(
    acceptedFiles => {
      if (_.isEmpty(acceptedFiles)) {
        setDropError(t('landscape.boundaries_file_no_accepted'));
        return;
      }
      setDropError(null);

      const selectedFile = acceptedFiles[0];
      openFile(selectedFile).then(content => {
        setCurrentFile(selectedFile);
        setMedia({
          filename: selectedFile.name,
          type: selectedFile.type,
          content,
        });
      });
    },
    [t]
  );

  const errors = useMemo(() => (dropError ? [dropError] : []), [dropError]);

  const onAddWrapper = useCallback(() => {
    onAdd(media);
  }, [media, onAdd]);

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>{t('storyMap.form_media_add_dialog_title')}</DialogTitle>
      <DialogContent>
        <DropZone
          maxSize={STORY_MAP_MEDIA_MAX_SIZE}
          fileTypes={STORY_MAP_MEDIA_ACCEPTED_TYPES}
          fileExtensions={STORY_MAP_MEDIA_ACCEPTED_EXTENSIONS}
          onDrop={onDrop}
          errors={errors}
          currentFile={currentFile}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>
          {t('storyMap.form_media_add_dialog_close')}
        </Button>
        <Button variant="contained" onClick={onAddWrapper}>
          {t('storyMap.form_media_add_dialog_add')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const EditableImage = props => {
  const { t } = useTranslation();
  const { image, onUpdate, onDelete, processing } = props;
  return (
    <Stack
      sx={{
        position: 'relative',
      }}
    >
      <img src={image.content} alt="TODO" style={{ width: '100%' }} />
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
  const { audio, onUpdate, onDelete, processing } = props;
  useEffect(() => {
    setId(uuidv4());
  }, [audio]);
  return (
    <Stack spacing={1}>
      {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
      <audio key={id} style={{ width: '100%' }} controls>
        <source src={audio.url || audio.content} type={audio.type} />
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
      {value ? (
        value.type.startsWith('image') ? (
          <EditableImage image={value} onUpdate={onOpen} onDelete={onDelete} />
        ) : (
          <EditableAudio audio={value} onUpdate={onOpen} onDelete={onDelete} />
        )
      ) : (
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
