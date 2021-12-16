import React from 'react'
import _ from 'lodash'
import { useTranslation } from 'react-i18next'
import { styled } from '@mui/material/styles'
import useMediaQuery from '@mui/material/useMediaQuery'
import {
  Select,
  MenuItem,
  InputBase
} from '@mui/material'

import { LOCALES } from 'localization/i18n'
import theme from 'theme'

const SelectInput = styled(InputBase)(({ theme }) => ({
  '& .MuiInputBase-input': {
    backgroundColor: theme.palette.gray.lite1,
    borderRadius: 0,
    border: 'none',
    fontSize: 12,
    padding: theme.spacing(1)
  },
  '& .MuiInputBase-input:focus': {
    borderRadius: 0
  }
}))

const LocalePicker = () => {
  const { t, i18n } = useTranslation()

  const isSmall = useMediaQuery(theme.breakpoints.down('md'))

  const handleChange = event => {
    const locale = _.get(event, 'target.value')
    i18n.changeLanguage(locale)
  }

  const getLocaleLabel = locale => isSmall
    ? `localization.locale_${locale}_small`
    : `localization.locale_${locale}`

  return (
    <Select
      size="small"
      value={i18n.resolvedLanguage}
      onChange={handleChange}
      input={<SelectInput />}
    >
      {Object.keys(LOCALES).map(locale => (
        <MenuItem key={locale} value={locale}>
          {t(getLocaleLabel(locale)).toUpperCase()}
        </MenuItem>
      ))}
    </Select>
  )
}

export default LocalePicker
