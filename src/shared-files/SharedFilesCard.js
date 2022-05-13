import React from 'react';

import { useTranslation } from 'react-i18next';

import {
  Button,
  Card,
  CardContent,
  CardHeader,
  Typography,
} from '@mui/material';

import FileCard from './FileCard';

import theme from 'theme';

const SharedFilesCard = ({ group }) => {
  const { t } = useTranslation();
  const { dataEntries: sharedFiles } = group;

  return (
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
          <FileCard key={index} file={item} />
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
  );
};

export default SharedFilesCard;
