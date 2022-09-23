import React, { useEffect } from 'react';

import _ from 'lodash/fp';
import { usePermission } from 'permissions';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';

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

import { useGroupContext } from 'group/groupContext';
import { fetchGroupSharedData } from 'sharedData/sharedDataSlice';

import { SHARED_DATA_ACCEPTED_EXTENSIONS } from 'config';

import SharedDataEntry from './SharedDataEntry';

const SharedFilesCard = props => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { onUploadClick, onAddVisualizationClick } = props;
  const { group, owner, entityType } = useGroupContext();
  const { allowed } = usePermission('group.viewFiles', group);
  const { data: sharedFiles, fetching } = useSelector(_.get('sharedData.list'));
  const hasFiles = !_.isEmpty(sharedFiles);

  useEffect(() => {
    if (allowed) {
      dispatch(fetchGroupSharedData({ slug: group.slug }));
    }
  }, [dispatch, group, allowed]);

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
              {sharedFiles.map(file => (
                <SharedDataEntry key={file.id} file={file} group={group} />
              ))}
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
