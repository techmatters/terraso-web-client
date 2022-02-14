import React from 'react';
import { useTranslation } from 'react-i18next';
import { Backdrop, CircularProgress } from '@mui/material';

const PageLoader = () => {
  const { t } = useTranslation();
  return (
    <Backdrop sx={{ zIndex: theme => theme.zIndex.drawer + 1 }} open={true}>
      <CircularProgress aria-label={t('common.loader_label')} color="inherit" />
    </Backdrop>
  );
};

export default PageLoader;
