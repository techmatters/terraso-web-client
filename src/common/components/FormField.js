import React from 'react'
import {
  FormControlUnstyled,
  OutlinedInput,
  InputLabel,
  FormHelperText
} from '@mui/material'

import theme from 'theme'

const FormField = ({ id, label, error, info, inputProps = {} }) => (
  <FormControlUnstyled style={{ marginBottom: theme.spacing(3) }}>
    <InputLabel error={!!error} shrink htmlFor={id}>
      {label}
    </InputLabel>
    <OutlinedInput
      id={id}
      error={!!error}
      aria-describedby={`${id}-helper-text`}
      sx={{ width: '100%' }}
      {...inputProps}
    />
    {!error
      ? null
      : (<FormHelperText error id={`${id}-helper-text`}>{error}</FormHelperText>)
    }
    {!error && !info
      ? null
      : (<FormHelperText id={`${id}-helper-text`}>{info}</FormHelperText>)
    }
  </FormControlUnstyled>
)

export default FormField
