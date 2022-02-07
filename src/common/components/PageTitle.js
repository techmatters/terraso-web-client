import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Typography } from '@mui/material';

const PageTitle = ({ title }) => {
  const { t } = useTranslation();
  const fullTitle = `${t('common.terraso_projectName')} | ${title}`;
  useEffect(() => {
    document.title = fullTitle;
  }, [fullTitle]);

  return (
    <Typography variant="h1" sx={theme => ({ marginBottom: theme.spacing(3) })}>
      {title}
    </Typography>
  );
};

export default PageTitle;
