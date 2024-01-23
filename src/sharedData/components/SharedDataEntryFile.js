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
import React, { useMemo, useState } from 'react';
import { filesize } from 'filesize';
import _ from 'lodash/fp';
import { useTranslation } from 'react-i18next';
import CloseIcon from '@mui/icons-material/Close';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import MapIcon from '@mui/icons-material/Map';
import ShareIcon from '@mui/icons-material/Share';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  IconButton,
  Link,
  ListItem,
  MenuItem,
  Select,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';

import { useCollaborationContext } from 'collaboration/collaborationContext';
import CopyLink from 'common/components/CopyLink';
import RouterLink from 'common/components/RouterLink';
import { formatDate } from 'localization/utils';
import { SHARE_ACCESS_TYPES } from 'sharedData/sharedDataConstants';
import { useSharedData } from 'sharedData/sharedDataHooks';

import SharedDataEntryBase, { ICON_SIZE } from './SharedDataEntryBase';
import SharedFileIcon from './SharedFileIcon';

const StackRow = props => (
  <Stack direction="row" alignItems="center" spacing={1} {...props} />
);

const Visualizations = props => {
  const { baseOwnerUrl } = useCollaborationContext();
  const { i18n, t } = useTranslation();
  const { file } = props;
  if (_.isEmpty(file.visualizations)) {
    return null;
  }

  return (
    <Stack
      component="ul"
      sx={{ width: '100%', listStyle: 'none', p: 0 }}
      divider={<Divider aria-hidden="true" component="li" />}
    >
      {file.visualizations.map(visualization => (
        <ListItem
          key={visualization.id}
          sx={{ bgcolor: 'gray.lite2', fontSize: 14, color: 'gray.dark1' }}
        >
          <Grid container spacing={1}>
            <Grid item sm={7} xs={12} component={StackRow}>
              <MapIcon />
              <Link
                component={RouterLink}
                to={`${baseOwnerUrl}/map/${visualization.slug}`}
              >
                {_.get('title', visualization)}
              </Link>
            </Grid>
            <Grid item sm={5} xs={12}>
              {formatDate(i18n.resolvedLanguage, visualization.createdAt)}, by{' '}
              {t('user.full_name', { user: visualization.createdBy })}
            </Grid>
          </Grid>
        </ListItem>
      ))}
    </Stack>
  );
};

const DownloadComponent = props => {
  const { t } = useTranslation();
  const { downloadFile } = useSharedData();
  const { sharedResource } = props;
  const dataEntry = useMemo(
    () => sharedResource.dataEntry,
    [sharedResource.dataEntry]
  );
  const handleDownload = e => {
    e.preventDefault();
    downloadFile(dataEntry);
  };

  return (
    <IconButton
      onClick={handleDownload}
      aria-label={t('sharedData.download_label', {
        name: dataEntry.name,
      })}
    >
      <FileDownloadIcon
        sx={theme => ({
          marginTop: '2px',
          width: ICON_SIZE,
          height: ICON_SIZE,
          color: theme.palette.secondary.main,
        })}
      />
    </IconButton>
  );
};

const ShareDialog = props => {
  const { t } = useTranslation();
  const { sharedResource, open, handleClose } = props;
  const dataEntry = useMemo(
    () => sharedResource.dataEntry,
    [sharedResource.dataEntry]
  );

  // focus on the close button on open
  const onCloseRefChange = ref => {
    if (ref) {
      ref.focus();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      aria-labelledby="share-file-dialog-title"
      fullWidth
      maxWidth="sm"
    >
      <DialogTitle
        component={Stack}
        direction="row"
        alignItems="center"
        justifyContent="space-between"
      >
        <Typography
          id="share-file-dialog-title"
          component="h1"
          variant="h2"
          sx={{ p: 0 }}
        >
          {t('sharedData.share_file_dialog_title', { name: dataEntry.name })}
        </Typography>
        <IconButton
          ref={onCloseRefChange}
          onClick={handleClose}
          sx={{ ml: 3 }}
          aria-label={t('sharedData.share_file_dialog_close')}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ pb: 5 }}>
        <Stack spacing={1} direction="row" alignItems="center">
          <Select
            value={sharedResource.shareAccess}
            inputProps={{
              'aria-label': t(
                'sharedData.share_file_dialog_share_access_label'
              ),
            }}
          >
            {SHARE_ACCESS_TYPES.map((type, index) => (
              <MenuItem key={index} value={type}>
                {t('sharedData.share_file_dialog_share_access_type', {
                  context: type,
                })}
              </MenuItem>
            ))}
          </Select>
          <Typography>
            {t('sharedData.share_file_dialog_share_access_suffix')}
          </Typography>
        </Stack>
        <CopyLink pageUrl={sharedResource.shareUrl} />
      </DialogContent>
    </Dialog>
  );
};

const ShareComponent = props => {
  const { t } = useTranslation();
  const { sharedResource } = props;
  const dataEntry = useMemo(
    () => sharedResource.dataEntry,
    [sharedResource.dataEntry]
  );

  const [open, setOpen] = useState(false);

  const handleOpen = () => setOpen(true);
  const handleClose = () => {
    setOpen(false);
  };

  const label = t('sharedData.share_file_label', {
    name: dataEntry.name,
  });

  return (
    <>
      <Tooltip title={label}>
        <IconButton aria-label={label} onClick={handleOpen}>
          <ShareIcon
            sx={theme => ({
              marginTop: '2px',
              width: ICON_SIZE,
              height: ICON_SIZE,
              color: theme.palette.secondary.main,
            })}
          />
        </IconButton>
      </Tooltip>
      <ShareDialog
        sharedResource={sharedResource}
        open={open}
        handleClose={handleClose}
      />
    </>
  );
};

const SharedDataEntryFile = props => {
  const { sharedResource } = props;
  return (
    <SharedDataEntryBase
      sharedResource={sharedResource}
      EntryTypeIcon={SharedFileIcon}
      DownloadComponent={DownloadComponent}
      ShareComponent={ShareComponent}
      info={filesize(sharedResource.dataEntry.size, { round: 0 })}
    >
      <Visualizations file={sharedResource.dataEntry} />
    </SharedDataEntryBase>
  );
};

export default SharedDataEntryFile;
