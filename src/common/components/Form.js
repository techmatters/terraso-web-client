import React, { useEffect, useState } from 'react'
import _ from 'lodash'
import { useTranslation } from 'react-i18next'
import {
  FormGroup,
  Alert,
  Button,
  Stack
} from '@mui/material'

import theme from 'theme'
import FormField from 'common/components/FormField'

const Form = props => {
  const { t } = useTranslation()
  const { prefix, fields, values, error, onSave } = props

  const [updatedValues, setUpdatedValues] = useState(null)

  useEffect(() => {
    if (values) {
      setUpdatedValues(values)
    }
  }, [values])

  const onFieldChange = (field, value) => {
    setUpdatedValues({
      ...updatedValues,
      [field]: value
    })
  }

  return (
    <FormGroup sx={{ width: '100%' }}>
      {fields.map(field => (
        <FormField
          key={field.name}
          id={`${prefix}-${field.name}`}
          label={field.label}
          info={field.info}
          value={_.get(updatedValues, field.name, '')}
          onChange={event => onFieldChange(field.name, event.target.value)}
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
          variant="contained"
          onClick={() => onSave(updatedValues)}
        >
          {t('common.form_save_button')}
        </Button>
        <Button variant="text">{t('common.form_cancel_button')}</Button>
      </Stack>
    </FormGroup>

  )
}

export default Form
