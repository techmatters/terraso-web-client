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
import React, { useCallback, useMemo, useState } from 'react';
import { filesize } from 'filesize';
import _ from 'lodash/fp';
import { usePermission } from 'permissions';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'terrasoApi/store';
import CloseIcon from '@mui/icons-material/Close';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import LockIcon from '@mui/icons-material/Lock';
import MapIcon from '@mui/icons-material/Map';
import PublicIcon from '@mui/icons-material/Public';
import ShareIcon from '@mui/icons-material/Share';
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
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
  Typography,
} from '@mui/material';

import { useCollaborationContext } from 'collaboration/collaborationContext';
import CopyLink from 'common/components/CopyLink';
import RouterLink from 'common/components/RouterLink';
import { formatDate } from 'localization/utils';
import { useShareEvent } from 'monitoring/events';
import {
  SHARE_ACCESS_ALL,
  SHARE_ACCESS_TYPES,
} from 'sharedData/sharedDataConstants';
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
              <MapIcon alt={t('sharedData.map_label')} role="img" />
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
      title={t('sharedData.download_label', {
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
  const { owner } = useCollaborationContext();

  const { sharedResource, open, handleClose, onUpdateSharedResource } = props;
  const dataEntry = useMemo(
    () => sharedResource.dataEntry,
    [sharedResource.dataEntry]
  );
  const processing = useSelector(
    _.get(`sharedData.processing.${sharedResource.id}`)
  );
  const { allowed: allowedToEditSharedData } = usePermission(
    'sharedData.edit',
    {
      owner,
      dataEntry,
    }
  );
  const [showUpdateSuccess, setShowUpdateSuccess] = useState();

  // focus on the close button on open
  const onCloseRefChange = ref => {
    if (ref) {
      ref.focus();
    }
  };

  const { onShare } = useShareEvent();

  const onChange = useCallback(
    event => {
      setShowUpdateSuccess(false);
      const shareAccess = event.target.value;
      onUpdateSharedResource({
        ...sharedResource,
        shareAccess,
      }).then(data => {
        const success = _.get('meta.requestStatus', data) === 'fulfilled';
        if (success) {
          setShowUpdateSuccess(true);
        }
      });
    },
    [onUpdateSharedResource, sharedResource]
  );

  const onCloseWrapper = useCallback(() => {
    setShowUpdateSuccess(false);
    handleClose();
  }, [handleClose]);

  return (
    <Dialog
      open={open}
      onClose={onCloseWrapper}
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
          onClick={onCloseWrapper}
          sx={{ ml: 3 }}
          title={t('common.dialog_close_label')}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        {!allowedToEditSharedData && (
          <span className="sr-only sr-only-focusable">
            {[
              t('sharedData.share_file_dialog_share_access_type', {
                context: sharedResource.shareAccess,
              }),
              t('sharedData.share_file_dialog_share_access_suffix'),
            ].join(' ')}
          </span>
        )}
        <Stack
          spacing={1}
          direction="row"
          alignItems="center"
          {...(allowedToEditSharedData ? {} : { 'aria-hidden': true })}
        >
          <Select
            disabled={!allowedToEditSharedData || processing}
            value={sharedResource.shareAccess}
            onChange={onChange}
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
        {!allowedToEditSharedData && (
          <Stack
            alignItems="center"
            direction="row"
            spacing={0.5}
            sx={{ mt: 1 }}
          >
            <LockIcon sx={{ fontSize: 16, color: 'gray.dark1' }} />
            <Typography variant="caption">
              {t('sharedData.share_file_dialog_share_access_not_allowed')}
            </Typography>
          </Stack>
        )}
        {sharedResource.shareAccess === SHARE_ACCESS_ALL && (
          <Stack
            alignItems="center"
            direction="row"
            spacing={0.5}
            sx={{ mt: 1 }}
          >
            <PublicIcon sx={{ fontSize: 16, color: 'gray.dark1' }} />
            <Typography variant="caption">
              {t('sharedData.share_file_dialog_share_access_all_warning')}
            </Typography>
          </Stack>
        )}
        <CopyLink pageUrl={sharedResource.shareUrl} onShare={onShare} />
      </DialogContent>
      <DialogActions
        sx={{
          justifyContent: 'space-between',
          alignItems: 'center',
          pl: 3,
          pr: 3,
          pb: 3,
        }}
      >
        {showUpdateSuccess ? (
          <Alert severity="success" sx={{ pt: 0, pb: 0 }}>
            {t('sharedData.share_file_dialog_share_access_updated', {
              name: sharedResource.dataEntry.name,
            })}
          </Alert>
        ) : (
          <div />
        )}
        <Button variant="outlined" onClick={onCloseWrapper}>
          {t('sharedData.share_file_dialog_share_access_done')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const ShareComponent = props => {
  const { t } = useTranslation();
  const { sharedResource, onUpdateSharedResource } = props;
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
      <IconButton title={label} onClick={handleOpen}>
        <ShareIcon
          sx={theme => ({
            marginTop: '2px',
            width: ICON_SIZE,
            height: ICON_SIZE,
            color: theme.palette.secondary.main,
          })}
        />
      </IconButton>
      <ShareDialog
        sharedResource={sharedResource}
        onUpdateSharedResource={onUpdateSharedResource}
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
      fileSize={filesize(sharedResource.dataEntry.size, { round: 0 })}
      resourceType={sharedResource.dataEntry.resourceType}
    >
      <Visualizations file={sharedResource.dataEntry} />
    </SharedDataEntryBase>
  );
};

export default SharedDataEntryFile;
