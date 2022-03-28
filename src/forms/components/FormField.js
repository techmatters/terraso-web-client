import React from 'react';
import _ from 'lodash/fp';
import { useTranslation } from 'react-i18next';
import { Controller } from 'react-hook-form';
import {
  OutlinedInput,
  InputLabel,
  FormHelperText,
  Typography,
  Stack,
} from '@mui/material';
import { FormControlUnstyled } from '@mui/base';

import theme from 'theme';

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
      error={!!fieldState.error}
      {...(info ? { 'aria-describedby': `${id}-helper-text` } : {})}
      sx={theme =>
        _.mergeWith(
          null,
          {
            width: '100%',
          },
          theme.components.MuiOutlinedInput.defaultProps.sx
        )
      }
      {...inputProps}
      {...field}
    />
  );
};

const FormField = props => {
  const { control, required, disabled, id, name, label, info } = props;
  const { t } = useTranslation();
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <FormControlUnstyled style={{ marginBottom: theme.spacing(3) }}>
          <Stack
            component={InputLabel}
            direction="row"
            spacing={1}
            disabled={disabled}
            error={!!fieldState.error}
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
          {fieldState.error && (
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
      )}
    />
  );
};

export default FormField;
