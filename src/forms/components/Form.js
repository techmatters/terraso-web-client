import React, { useEffect } from 'react'
import _ from 'lodash'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import {
  Alert,
  Button,
  Stack
} from '@mui/material'
import { yupResolver } from '@hookform/resolvers/yup'

import theme from 'theme'
import FormField from 'forms/components/FormField'

const Form = props => {
  const { t } = useTranslation()
  const { prefix, fields, values, error, validationSchema, onSave } = props

  const getInitialEmptyValues = () => _.chain(fields)
    .map(field => ([field.name, '']))
    .fromPairs()
    .value()

  const { control, handleSubmit, reset } = useForm({
    defaultValues: values || getInitialEmptyValues(),
    resolver: yupResolver(validationSchema)
  })

  const requiredFields = _.chain(_.get(validationSchema, 'fields', {}))
    .toPairs()
    .filter(([name, field]) => _.get(field, 'exclusiveTests.required', false))
    .map(([name, field]) => name)
    .value()

  useEffect(() => {
    if (values) {
      reset(values)
    }
  }, [values, reset])

  const onSubmit = data => onSave(data)

  return (
    <form onSubmit={handleSubmit(onSubmit)} sx={{ width: '100%' }} noValidate>
      {fields.map(field => (
        <FormField
          control={control}
          required={_.includes(requiredFields, field.name)}
          key={field.name}
          id={`${prefix}-${field.name}`}
          name={field.name}
          label={field.label}
          info={field.info}
          inputProps={{
            type: field.type || 'text',
            placeholder: field.placeholder,
            ..._.get(field, 'props.inputProps', {})
          }}
          {..._.get(field, 'props', {})}
        />
      ))}
      {!error
        ? null
        : (<Alert severity="error">{error}</Alert>)
      }
      <Stack
        spacing={2}
        direction="row"
        justifyContent='flex-end'
        sx={{ marginTop: theme.spacing(2) }}
      >
        <Button
          type="submit"
          variant="contained"
        >
          {t('common.form_save_button')}
        </Button>
        <Button variant="text">{t('common.form_cancel_button')}</Button>
      </Stack>
    </form>

  )
}

export default Form
