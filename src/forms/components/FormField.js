import React from 'react'
import _ from 'lodash'
import { useTranslation } from 'react-i18next'
import { Controller } from 'react-hook-form'
import {
  FormControlUnstyled,
  OutlinedInput,
  InputLabel,
  FormHelperText
} from '@mui/material'

import theme from 'theme'

const FormField = ({ control, required, id, name, label, info, inputProps }) => {
  const { t } = useTranslation()
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <FormControlUnstyled style={{ marginBottom: theme.spacing(3) }}>
          <InputLabel error={!!fieldState.error} shrink htmlFor={id}>
            {t(label).toUpperCase()} {required && `(${t('form.required_label')})` }
          </InputLabel>
          <OutlinedInput
            id={id}
            error={!!fieldState.error}
            aria-describedby={`${id}-helper-text`}
            sx={{ width: '100%' }}
            {...inputProps}
            {...field}
          />
          {info && (
            <FormHelperText id={`${id}-helper-text`}>{t(info)}</FormHelperText>
          )}
          {fieldState.error && (
            <FormHelperText error id={`${id}-helper-text`}>
              {t(
                _.get(fieldState, 'error.message.key', 'form.validation_field_invalid'),
                _.get(fieldState, 'error.message.params', {})
              )}
            </FormHelperText>
          )}
        </FormControlUnstyled>
      )}
    />
  )
}

export default FormField
