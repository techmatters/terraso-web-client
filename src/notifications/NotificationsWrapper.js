import React from 'react'
import { useTranslation } from 'react-i18next'
import { SnackbarProvider } from 'notistack'
import { Alert } from '@mui/material'

const MAX_NOTIFICATIONS = 3
const AUTO_HIDE_DURATION = 10000

const NotificationsWrapper = props => {
  const { t } = useTranslation()
  const { children } = props

  return (
    <SnackbarProvider
      maxSnack={MAX_NOTIFICATIONS}
      autoHideDuration={AUTO_HIDE_DURATION}
      anchorOrigin={{
        vertical: 'top',
        horizontal: 'center'
      }}
      content={(key, message) => (
          <Alert severity={message.severity} sx={{ width: '100%' }}>
          {t(message.content)}
        </Alert>
      )}
    >
      {children}
    </SnackbarProvider>
  )
}

export default NotificationsWrapper
