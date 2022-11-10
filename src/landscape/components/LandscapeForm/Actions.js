import React, { useCallback } from 'react';

import { useTranslation } from 'react-i18next';

import { Button, Stack } from '@mui/material';

import { useFormGetContext } from 'forms/formContext';

const Actions = props => {
  const { t } = useTranslation();
  const {
    isNew,
    onCancel,
    updatedValues,
    onNext,
    onSave,
    nextLabel,
    isForm,
    saveDisabled = false,
  } = props;
  const formContext = useFormGetContext();

  const onNextWrapper = useCallback(async () => {
    const success = isForm ? await formContext.trigger?.() : true;
    if (success) {
      onNext(updatedValues);
    }
  }, [formContext, updatedValues, onNext, isForm]);

  const onSaveWrapper = useCallback(async () => {
    const success = isForm ? await formContext.trigger?.() : true;
    if (success) {
      onSave(updatedValues);
    }
  }, [formContext, updatedValues, onSave, isForm]);

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
          {onSave && (
            <Button
              variant="outlined"
              onClick={onSaveWrapper}
              disabled={saveDisabled}
              sx={{ pl: 2, pr: 2 }}
            >
              {t('landscape.form_save_now')}
            </Button>
          )}
          <Button
            variant="contained"
            onClick={onNextWrapper}
            sx={{ pl: 6, pr: 6 }}
          >
            {nextLabel || t('landscape.form_next')}
          </Button>
        </Stack>
      </Stack>
    );
  }

  return (
    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
      <Button
        variant="contained"
        onClick={onSave ? onSaveWrapper : onNextWrapper}
        disabled={saveDisabled}
        sx={{ pl: 6, pr: 6 }}
      >
        {t('landscape.form_update')}
      </Button>
      <Button variant="text" onClick={onCancel} sx={{ pl: 6, pr: 6 }}>
        {t('landscape.form_cancel')}
      </Button>
    </Stack>
  );
};

export default Actions;
