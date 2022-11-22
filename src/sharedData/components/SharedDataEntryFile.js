import React from 'react';

import { filesize } from 'filesize';
import _ from 'lodash/fp';
import { useTranslation } from 'react-i18next';
import { Link as RouterLink } from 'react-router-dom';

import FileDownloadIcon from '@mui/icons-material/FileDownload';
import MapIcon from '@mui/icons-material/Map';
import {
  Divider,
  Grid,
  IconButton,
  Link,
  ListItem,
  Stack,
} from '@mui/material';

import { formatDate } from 'localization/utils';

import { useGroupContext } from 'group/groupContext';
import { useSharedData } from 'sharedData/sharedDataHooks';

import SharedDataEntryBase, { ICON_SIZE } from './SharedDataEntryBase';
import SharedFileIcon from './SharedFileIcon';

const StackRow = props => (
  <Stack direction="row" alignItems="center" spacing={1} {...props} />
);

const Visualizations = props => {
  const { baseOwnerUrl } = useGroupContext();
  const { i18n, t } = useTranslation();
  const { file } = props;
  if (_.isEmpty(file.visualizations)) {
    return null;
  }

  return (
    <Stack
      component="ul"
      sx={{ width: '100%', listStyle: 'none', p: 0 }}
      divider={<Divider component="li" />}
    >
      {file.visualizations.map(visualization => (
        <ListItem
          sx={{ bgcolor: 'gray.lite2', fontSize: 14, color: 'gray.dark1' }}
        >
          <Grid container key={visualization.id} spacing={1}>
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
  const { dataEntry } = props;

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
          color: theme.palette.gray.dark1,
        })}
      />
    </IconButton>
  );
};

const SharedDataEntryFile = props => {
  const { dataEntry } = props;
  return (
    <SharedDataEntryBase
      dataEntry={dataEntry}
      EntryTypeIcon={SharedFileIcon}
      DownloadComponent={DownloadComponent}
      info={filesize(dataEntry.size, { round: 0 })}
    >
      <Visualizations file={dataEntry} />
    </SharedDataEntryBase>
  );
};

export default SharedDataEntryFile;
