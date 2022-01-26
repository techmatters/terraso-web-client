import React from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Stack } from '@mui/material';

import logo from 'assets/logo.svg';

const UnexpectedError = () => {
  const { t } = useTranslation();

  return (
    <Stack
      direction="column"
      alignItems="center"
      justifyContent="center"
      style={{ height: '80vh' }}
    >
      <Stack sx={{ maxWidth: 'sm' }} alignItems="center">
        <img src={logo} height="35px" alt={t('common.terraso_projectName')} />

        <Alert severity="error" sx={{ margin: '3em 0 8em' }}>
          {t('common.unexpected_error')}
        </Alert>
      </Stack>
    </Stack>
  );
};

export default UnexpectedError;
