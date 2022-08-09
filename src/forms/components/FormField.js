import React from 'react';

import _ from 'lodash/fp';
import { useTranslation } from 'react-i18next';

import { FormControlUnstyled } from '@mui/base';
import {
  FormHelperText,
  InputLabel,
  OutlinedInput,
  Stack,
  Typography,
} from '@mui/material';

const FormFieldInput = props => {
  const { disabled, id, inputProps, field, fieldState, renderInput, info } =
    props;

  if (renderInput) {
    return renderInput(props);
  }

  return (
    <OutlinedInput
      id={id}
      disabled={disabled}
      error={!!fieldState?.error}
      {...(info ? { 'aria-describedby': `${id}-helper-text` } : {})}
      sx={{
        width: '100%',
      }}
      {...field}
      {...inputProps}
    />
  );
};

const FormField = props => {
  const { field, fieldState, required, disabled, id, label, info } = props;
  const { t } = useTranslation();
  return (
    <FormControlUnstyled style={{ flexGrow: 1 }}>
      <Stack
        component={InputLabel}
        id={`${id}-label`}
        direction="row"
        spacing={1}
        disabled={disabled}
        error={!!fieldState?.error}
        htmlFor={id}
      >
        <Typography
          sx={{
            textTransform: 'uppercase',
          }}
        >
          {t(label)}
        </Typography>
        {required && <Typography>({t('form.required_label')})</Typography>}
      </Stack>
      <FormFieldInput field={field} fieldState={fieldState} {...props} />
      {info && (
        <FormHelperText id={`${id}-helper-text`}>{t(info)}</FormHelperText>
      )}
      {fieldState?.error && (
        <FormHelperText error id={`${id}-helper-text`}>
          {t(
            _.getOr(
              'form.validation_field_invalid',
              'error.message.key',
              fieldState
            ),
            _.getOr({}, 'error.message.params', fieldState)
          )}
        </FormHelperText>
      )}
    </FormControlUnstyled>
  );
};

export default FormField;
