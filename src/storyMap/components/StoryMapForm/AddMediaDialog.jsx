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

import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import getVideoId from 'get-video-id';
import _ from 'lodash/fp';
import { useTranslation } from 'react-i18next';
import CloudUploadOutlinedIcon from '@mui/icons-material/CloudUploadOutlined';
import OpenInNew from '@mui/icons-material/OpenInNew';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormHelperText,
  Link,
  OutlinedInput,
  Paper,
  Stack,
  Typography,
} from '@mui/material';

import DropZone from 'terraso-web-client/common/components/DropZone';
import { openFile } from 'terraso-web-client/common/fileUtils';
import { useStoryMapMediaContext } from 'terraso-web-client/storyMap/components/StoryMapForm/storyMapConfigContext';

import {
  STORY_MAP_MEDIA_ACCEPTED_EXTENSIONS,
  STORY_MAP_MEDIA_ACCEPTED_TYPES,
  STORY_MAP_MEDIA_MAX_SIZE,
} from 'terraso-web-client/config';

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

const AddMediaDialog = memo(props => {
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
          buttonLabel={t('storyMap.form_media_add_dialog_select_file')}
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

export default AddMediaDialog;
