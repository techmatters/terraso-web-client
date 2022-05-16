import React from 'react';

import _ from 'lodash/fp';
import { useTranslation } from 'react-i18next';

import {
  Button,
  Card,
  CardContent,
  CardHeader,
  Typography,
} from '@mui/material';

import Restricted from 'permissions/components/Restricted';

import FileCard from './FileCard';

import theme from 'theme';

const SharedFilesCard = ({ group }) => {
  const { t } = useTranslation();
  const { dataEntries: sharedFiles } = group;

  if (_.isEmpty(sharedFiles)) {
    return null;
  }

  return (
    <Restricted permission="group.viewFiles" resource={group}>
      <Card variant="outlined">
        <CardHeader
          disableTypography
          title={
            <Typography variant="h2" id="group-view-card-title">
              {t('shared_files.title')}
            </Typography>
          }
        />
        <CardContent>
          {sharedFiles.map((item, index) => (
            <FileCard key={index} file={item} group={group} />
          ))}
          <Typography
            variant="body1"
            sx={{ marginTop: theme.spacing(2), marginBottom: theme.spacing(2) }}
          >
            {t('shared_files.description')}
          </Typography>
          <Button variant="outlined">{t('shared_files.upload_button')}</Button>
        </CardContent>
      </Card>
    </Restricted>
  );
};

export default SharedFilesCard;
