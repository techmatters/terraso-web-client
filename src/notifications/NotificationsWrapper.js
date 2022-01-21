import React, { useEffect, createRef } from 'react';
import _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { useSelector, useDispatch } from 'react-redux';
import { SnackbarProvider } from 'notistack';
import { Alert } from '@mui/material';

import { removeMessage } from './notificationsSlice';

const MAX_NOTIFICATIONS = 3;
const AUTO_HIDE_DURATION = 10000;

const NotificationsWrapper = props => {
  const { t } = useTranslation();
  const { children } = props;
  const notistackRef = createRef();
  const dispatch = useDispatch();
  const messages = useSelector(state => state.notifications.messages);

  useEffect(() => {
    const shownMessage = Object.keys(messages).map(messageKey => {
      notistackRef.current.enqueueSnackbar(messages[messageKey]);
      return messageKey;
    });
    shownMessage.forEach(key => {
      dispatch(removeMessage(key));
    });
  }, [messages, notistackRef, dispatch]);

  // To add more flexibility to messages and localization
  // the content of a message can hold multiple sub messages
  const getMessages = content => (_.isArray(content) ? content : [content]);

  const onClose = key => {
    notistackRef.current.closeSnackbar(key);
  };

  return (
    <SnackbarProvider
      preventDuplicate
      ref={notistackRef}
      maxSnack={MAX_NOTIFICATIONS}
      autoHideDuration={AUTO_HIDE_DURATION}
      anchorOrigin={{
        vertical: 'top',
        horizontal: 'center',
      }}
      content={(key, notification) => (
        <Alert
          onClose={() => onClose(key)}
          severity={notification.severity}
          sx={{ width: '100%' }}
        >
          {getMessages(notification.content)
            .map(message => t(message, notification.params))
            .join('. ')}
        </Alert>
      )}
    >
      {children}
    </SnackbarProvider>
  );
};

export default NotificationsWrapper;
