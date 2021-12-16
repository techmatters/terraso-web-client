import React, { useEffect } from 'react'
import _ from 'lodash'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import {
  Button,
  Stack
} from '@mui/material'
import { yupResolver } from '@hookform/resolvers/yup'

import theme from 'theme'
import FormField from 'forms/components/FormField'

const getInitialEmptyValues = fields => _.chain(fields)
  .map(field => ([field.name, '']))
  .fromPairs()
  .value()

const Form = props => {
  const { t } = useTranslation()
  const {
    prefix,
    fields,
    values,
    validationSchema,
    saveLabel,
    onSave,
    cancelLabel,
    onCancel
  } = props

  const { control, handleSubmit, reset } = useForm({
    defaultValues: {
      ...getInitialEmptyValues(fields),
      ...values
    },
    resolver: yupResolver(validationSchema)
  })

  const requiredFields = _.chain(_.get(validationSchema, 'fields', {}))
    .toPairs()
    .filter(([name, field]) => _.get(field, 'exclusiveTests.required', false))
    .map(([name]) => name)
    .value()

  useEffect(() => {
    if (values) {
      reset({
        ...getInitialEmptyValues(fields),
        ...values
      })
    }
  }, [values, fields, reset])

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
            placeholder: t(field.placeholder),
            ..._.get(field, 'props.inputProps', {})
          }}
          {..._.get(field, 'props', {})}
        />
      ))}
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
          {t(saveLabel)}
        </Button>
        {onCancel && (
          <Button
            variant="text"
            onClick={onCancel}
          >
            {t(cancelLabel)}
          </Button>
        )}
      </Stack>
    </form>
  )
}

export default Form
