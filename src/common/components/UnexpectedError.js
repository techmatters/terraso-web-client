import React from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Paper, Stack } from '@mui/material';

import logo from 'assets/logo.svg';

const UnexpectedError = () => {
  const { t } = useTranslation();

  return (
    <Stack
      direction="column"
      alignItems="center"
      justifyContent="center"
      sx={{ height: '80vh' }}
    >
      <Stack
        component={Paper}
        elevation={0}
        sx={theme => ({ maxWidth: 'md', padding: theme.spacing(3) })}
        alignItems="center"
      >
        <img
          src={logo}
          width="125"
          height="35"
          alt={t('common.terraso_projectName')}
        />

        <Alert severity="error" sx={{ margin: '3em 0 8em' }}>
          {t('common.unexpected_error', { error: '' })}
        </Alert>
      </Stack>
    </Stack>
  );
};

export default UnexpectedError;
