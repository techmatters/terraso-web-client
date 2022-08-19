import React, { useEffect } from 'react';

import _ from 'lodash/fp';
import { usePermission } from 'permissions';
import { Trans, useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';

import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CircularProgress,
  Typography,
} from '@mui/material';

import ExternalLink from 'common/components/ExternalLink';
import List from 'common/components/List';

import { useGroupContext } from 'group/groupContext';
import { fetchGroupSharedData } from 'sharedData/sharedDataSlice';

import { SHARED_DATA_ACCEPTED_EXTENSIONS } from 'config';

import SharedDataEntry from './SharedDataEntry';

const SharedFilesCard = props => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { onUploadClick } = props;
  const { group, owner } = useGroupContext();
  const { allowed } = usePermission('group.viewFiles', group);
  const { data: sharedFiles, fetching } = useSelector(_.get('sharedData.list'));
  const hasFiles = !_.isEmpty(sharedFiles);

  useEffect(() => {
    if (allowed) {
      dispatch(fetchGroupSharedData(group.slug));
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
        {hasFiles && (
          <List aria-describedby="shared-data-card-title">
            {sharedFiles.map(file => (
              <SharedDataEntry key={file.id} file={file} group={group} />
            ))}
          </List>
        )}
        <Typography
          variant="body1"
          sx={{
            marginTop: 2,
            marginBottom: 2,
          }}
        >
          {' '}
          <Trans
            i18nKey={
              hasFiles
                ? 'sharedData.description_with_files'
                : 'sharedData.description_without_files'
            }
            values={{
              extensions: SHARED_DATA_ACCEPTED_EXTENSIONS.map(
                ext => `*.${ext}`
              ).join(', '),
              name: owner.name,
              entityType: owner.defaultGroup
                ? t('sharedData.entity_type_landscape')
                : t('sharedData.entity_type_group'),
            }}
          >
            Prefix
            <ExternalLink href={t('sharedData.learn_more_url')}>
              link
            </ExternalLink>
            .
          </Trans>
        </Typography>
        <Button variant="outlined" onClick={onUploadClick}>
          {t('sharedData.upload_button')}
        </Button>
      </CardContent>
    </Card>
  );
};

export default SharedFilesCard;
