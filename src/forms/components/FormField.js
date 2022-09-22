import React, { useMemo } from 'react';

import _ from 'lodash/fp';
import { useTranslation } from 'react-i18next';

import { FormControlUnstyled } from '@mui/base';
import ErrorIcon from '@mui/icons-material/Report';
import {
  FormHelperText,
  InputLabel,
  OutlinedInput,
  Stack,
  Typography,
} from '@mui/material';

import { parseError } from 'forms/yup';

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

const getMessages = error => {
  if (_.has('message.key', error) || !_.isObject(error)) {
    return [error];
  }
  const errors = _.toPairs(error).flatMap(([key, value]) => getMessages(value));
  return errors;
};

const FormField = props => {
  const {
    field,
    fieldState,
    required,
    disabled,
    id,
    label,
    info,
    localizationPrefix,
  } = props;
  const { t } = useTranslation();

  const error = useMemo(() => {
    if (!fieldState?.error) {
      return null;
    }
    const errors = getMessages(fieldState.error);
    const generateError = error => {
      const parsedError = parseError(error, localizationPrefix);
      return t(parsedError.keys, parsedError.params);
    };

    if (_.isEmpty(errors)) {
      return t('form.validation_field_invalid_unexpected');
    }

    return errors.map(error => generateError(error)).join('. ');
  }, [fieldState, t, localizationPrefix]);

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
      {error && (
        <FormHelperText
          error
          id={`${id}-helper-text`}
          sx={{ display: 'flex', alignItems: 'center' }}
        >
          <ErrorIcon />
          {error}
        </FormHelperText>
      )}
    </FormControlUnstyled>
  );
};

export default FormField;
