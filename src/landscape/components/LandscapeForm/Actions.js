import React from 'react';

import { useTranslation } from 'react-i18next';

import { Button, Stack } from '@mui/material';

const Actions = props => {
  const { t } = useTranslation();
  const { isNew, onCancel } = props;
  if (isNew) {
    return (
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        justifyContent="space-between"
      >
        <Button variant="text" onClick={onCancel}>
          {t('landscape.form_back')}
        </Button>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
          <Button variant="outlined">{t('landscape.form_save_now')}</Button>
          <Button variant="contained">{t('landscape.form_next')}</Button>
        </Stack>
      </Stack>
    );
  }

  return (
    <Stack
      direction={{ xs: 'column', sm: 'row' }}
      justifyContent="space-between"
    >
      <Button variant="contained">{t('landscape.form_update')}</Button>
      <Button variant="text" onClick={onCancel}>
        {t('landscape.form_cancel')}
      </Button>
    </Stack>
  );
};

export default Actions;
