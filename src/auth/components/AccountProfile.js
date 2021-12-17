import React from 'react'
import {
  Stack,
  Typography
} from '@mui/material'
import { useTranslation } from 'react-i18next'

const AccountProfile = ({ tool }) => {
  const { t } = useTranslation()

  return (
    <Stack sx={{ maxWidth: 'sm' }} alignItems="center">
      <Typography variant="h1" >
        {t('account.welcome_to')}
      </Typography>

      <p>Profile page TK</p>

    </Stack>
  )
}

export default AccountProfile
