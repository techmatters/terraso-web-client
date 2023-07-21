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
import React from 'react';
import { filesize } from 'filesize';
import _ from 'lodash/fp';
import { useTranslation } from 'react-i18next';
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

import RouterLink from 'common/components/RouterLink';
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
          color: theme.palette.secondary.main,
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
