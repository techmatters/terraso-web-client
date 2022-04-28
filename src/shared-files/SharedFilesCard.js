import React from 'react';
import {
  Typography,
  Button,
  Card,
  CardHeader,
  CardContent,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import FileCard from './FileCard';
import theme from 'theme';

const SharedFilesCard = ({ group }) => {
  const { t } = useTranslation();

  const demoFiles = [
    {
      name: 'myfile',
      description: 'sample file',
      type: 'xls',
      size: 32,
      date: '2022-04-08',
      id: 23456,
    },
    {
      name: 'green eggs and ham',
      description: 'recipe',
      type: 'json',
      size: 77,
      date: '2022-04-01',
      id: 67890,
    },
  ];

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
        {demoFiles.map((item, index) => (
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
