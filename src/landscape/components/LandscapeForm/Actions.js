import React, { useCallback } from 'react';

import { useTranslation } from 'react-i18next';

import { Button, Stack } from '@mui/material';

import { useFormGetContext } from 'forms/formContext';

const Actions = props => {
  const { t } = useTranslation();
  const { isNew, onCancel, updatedValues, setUpdatedLandscape, onSave } = props;
  const { trigger } = useFormGetContext();

  const onNext = useCallback(async () => {
    const success = await trigger?.();
    if (success) {
      setUpdatedLandscape(updatedValues);
    }
  }, [trigger, updatedValues, setUpdatedLandscape]);

  const onSaveWrapper = useCallback(async () => {
    const success = await trigger?.();
    if (success) {
      onSave(updatedValues);
    }
  }, [trigger, updatedValues, onSave]);

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
          <Button
            variant="outlined"
            onClick={onSaveWrapper}
            sx={{ pl: 2, pr: 2 }}
          >
            {t('landscape.form_save_now')}
          </Button>
          <Button variant="contained" onClick={onNext} sx={{ pl: 6, pr: 6 }}>
            {t('landscape.form_next')}
          </Button>
        </Stack>
      </Stack>
    );
  }

  return (
    <Stack
      direction={{ xs: 'column', sm: 'row' }}
      justifyContent="space-between"
    >
      <Button variant="contained" onClick={onSaveWrapper}>
        {t('landscape.form_update')}
      </Button>
      <Button variant="text" onClick={onCancel}>
        {t('landscape.form_cancel')}
      </Button>
    </Stack>
  );
};

export default Actions;
