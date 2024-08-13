/*
 * Copyright © 2021-2023 Technology Matters
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see https://www.gnu.org/licenses/.
 */

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
    updateLabel,
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
        sx={{ marginTop: 2 }}
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
    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mt: 2 }}>
      <Button
        variant="contained"
        onClick={onSave ? onSaveWrapper : onNextWrapper}
        disabled={saveDisabled}
        sx={{ pl: 6, pr: 6 }}
      >
        {updateLabel || t('landscape.form_update')}
      </Button>
      <Button variant="text" onClick={onCancel} sx={{ pl: 6, pr: 6 }}>
        {t('landscape.form_cancel')}
      </Button>
    </Stack>
  );
};

export default Actions;
