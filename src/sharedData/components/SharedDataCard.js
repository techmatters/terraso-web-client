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
import React, { useCallback } from 'react';

import _ from 'lodash/fp';
import { usePermission } from 'permissions';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { useFetchData } from 'terrasoApi/utils';

import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CircularProgress,
  Stack,
  Typography,
} from '@mui/material';

import List from 'common/components/List';
import { ScrollTo } from 'navigation/scrollTo';

import { useGroupContext } from 'group/groupContext';
import { fetchGroupSharedData } from 'sharedData/sharedDataSlice';

import { SHARED_DATA_ACCEPTED_EXTENSIONS } from 'config';

import SharedDataEntryFile from './SharedDataEntryFile';
import SharedDataEntryLink from './SharedDataEntryLink';

const SharedFilesCard = props => {
  const { t } = useTranslation();
  const { onUploadClick, onAddVisualizationClick } = props;
  const { group, owner, entityType } = useGroupContext();
  const { allowed } = usePermission('group.viewFiles', group);
  const { data: sharedFiles, fetching } = useSelector(_.get('sharedData.list'));
  const hasFiles = !_.isEmpty(sharedFiles);

  useFetchData(
    useCallback(
      () => (allowed ? fetchGroupSharedData({ slug: group.slug }) : null),
      [group.slug, allowed]
    )
  );

  if (!allowed) {
    return null;
  }

  return (
    <Card
      component="section"
      aria-labelledby="shared-data-card-title"
      variant="outlined"
      sx={{ display: 'flex', flexDirection: 'column' }}
    >
      <CardHeader
        disableTypography
        title={
          <Typography variant="h2" id="shared-data-card-title">
            {t('sharedData.title')}
          </Typography>
        }
      />
      {fetching && (
        <CircularProgress
          aria-label={t('sharedData.loader_label')}
          sx={{ alignSelf: 'center' }}
        />
      )}
      <CardContent>
        <Typography sx={{ mb: 2 }}>
          {t('sharedData.card_description', {
            extensions: SHARED_DATA_ACCEPTED_EXTENSIONS.map(
              ext => `*.${ext}`
            ).join(', '),
            name: owner.name,
            entityType,
          })}
        </Typography>
        {hasFiles && (
          <>
            <List aria-describedby="shared-data-card-title">
              {sharedFiles.map(dataEntry =>
                dataEntry.entryType === 'LINK' ? (
                  <SharedDataEntryLink
                    key={dataEntry.id}
                    dataEntry={dataEntry}
                    group={group}
                  />
                ) : (
                  <SharedDataEntryFile
                    key={dataEntry.id}
                    dataEntry={dataEntry}
                    group={group}
                  />
                )
              )}
            </List>
            <Typography
              variant="body1"
              sx={{
                marginTop: 2,
                marginBottom: 2,
              }}
            >
              {t('sharedData.description_with_files', { entityType })}
            </Typography>
            <ScrollTo />
          </>
        )}
        <Stack direction="row" spacing={2}>
          <Button variant="contained" onClick={onUploadClick}>
            {t('sharedData.upload_button')}
          </Button>
          {onAddVisualizationClick && hasFiles && (
            <Button variant="outlined" onClick={onAddVisualizationClick}>
              {t('sharedData.add_visualization_button')}
            </Button>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
};

export default SharedFilesCard;
