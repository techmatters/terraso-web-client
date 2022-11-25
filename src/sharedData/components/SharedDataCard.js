import React, { useCallback } from 'react';

import _ from 'lodash/fp';
import { usePermission } from 'permissions';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';

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
import { useFetchData } from 'state/utils';

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
              {sharedFiles.map(dateEnty =>
                dateEnty.entryType === 'FILE' ? (
                  <SharedDataEntryFile
                    key={dateEnty.id}
                    dataEntry={dateEnty}
                    group={group}
                  />
                ) : (
                  <SharedDataEntryLink
                    key={dateEnty.id}
                    dataEntry={dateEnty}
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
