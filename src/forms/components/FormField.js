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

import React, { useMemo } from 'react';
import _ from 'lodash/fp';
import { useTranslation } from 'react-i18next';
import ErrorIcon from '@mui/icons-material/Report';
import {
  Box,
  FormHelperText,
  InputLabel,
  OutlinedInput,
  Stack,
  Typography,
} from '@mui/material';

import HelperText from 'common/components/HelperText';
import { parseError } from 'forms/yup';

const FormFieldInput = props => {
  const {
    disabled,
    id,
    inputProps,
    field,
    fieldState,
    renderInput,
    InputWrapper,
    info,
  } = props;

  if (renderInput) {
    return renderInput(props);
  }

  const Wrapper = InputWrapper || React.Fragment;

  return (
    <Wrapper>
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
        value={field.value || ''}
      />
    </Wrapper>
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
    helperText,
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
    <Box sx={{ flexGrow: 1 }}>
      <Stack
        direction="row"
        alignItems="center"
        spacing={1}
        sx={{ overflow: 'visible', mb: 1 }}
      >
        <Typography
          variant="caption"
          component={InputLabel}
          disableAnimation
          size="small"
          id={`${id}-label`}
          htmlFor={id}
          disabled={disabled}
          error={!!fieldState?.error}
          sx={{
            textTransform: 'uppercase',
            transform: 'none',
          }}
        >
          {t(label)}
          {required && (
            <Typography
              variant="caption"
              sx={{ textTransform: 'lowercase', ml: 1 }}
            >
              ({t('form.required_label')})
            </Typography>
          )}
        </Typography>
        {helperText && <HelperText label={label} {...helperText} />}
      </Stack>
      <FormFieldInput field={field} fieldState={fieldState} {...props} />
      {info && (
        <FormHelperText id={`${id}-helper-text`}>
          {typeof info === 'function' ? info({ fieldState, field }) : t(info)}
        </FormHelperText>
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
    </Box>
  );
};

export default FormField;
