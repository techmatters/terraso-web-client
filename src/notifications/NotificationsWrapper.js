import React from 'react'
import _ from 'lodash'
import { useTranslation } from 'react-i18next'
import { SnackbarProvider } from 'notistack'
import { Alert } from '@mui/material'

const MAX_NOTIFICATIONS = 3
const AUTO_HIDE_DURATION = 10000

const NotificationsWrapper = props => {
  const { t } = useTranslation()
  const { children } = props

  // To add more flexibility to messages and localization
  // the content of a message can hold multiple sub messages
  const getMessages = content => _.isArray(content)
    ? content
    : [content]

  return (
    <SnackbarProvider
      maxSnack={MAX_NOTIFICATIONS}
      autoHideDuration={AUTO_HIDE_DURATION}
      anchorOrigin={{
        vertical: 'top',
        horizontal: 'center'
      }}
      content={(key, notification) => (
        <Alert severity={notification.severity} sx={{ width: '100%' }}>
          {getMessages(notification.content)
            .map(message => t(message, notification.params))
            .join('. ')
          }
        </Alert>
      )}
    >
      {children}
    </SnackbarProvider>
  )
}

export default NotificationsWrapper
