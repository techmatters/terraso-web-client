import React from 'react'
import { useTranslation } from 'react-i18next'
import { Link as RouterLink } from 'react-router-dom'
import {
  Button,
  Stack,
  Typography
} from '@mui/material'
import AppleIcon from '@mui/icons-material/Apple'
import GoogleIcon from '@mui/icons-material/Google'

import logo from 'assets/logo.svg'

const AccountForm = ({ tool }) => {
  const { t } = useTranslation()

  return (
    <Stack
      direction="column"
      alignItems="center"
      justifyContent="center"
      style={{ height: '80vh' }}
    >
      <Stack sx={{ maxWidth: 'sm' }} alignItems="center">
        <Typography variant="h1" >
          {t('account.welcome_to')}
        </Typography>
        <img src={logo} height="35px" alt={t('common.terraso_projectName')} />

        <Stack spacing={3} sx={{ margin: '3em 0 8em' }}>
          <Button startIcon={<GoogleIcon sx={{ paddingRight: '5px' }} />} variant="outlined" component={RouterLink} to="/account/profile">
            {t('account.google_login')}
          </Button>

          <Button startIcon={<AppleIcon sx={{ paddingRight: '5px' }} />} variant="outlined" component={RouterLink} to="/account/profile">
            {t('account.apple_login')}
          </Button>
        </Stack>

        <p dangerouslySetInnerHTML={ { __html: t('account.disclaimer') } } />
      </Stack>
    </Stack>
  )
}

export default AccountForm
