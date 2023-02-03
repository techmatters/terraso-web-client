/*
 * Copyright © 2021-2023 Technology Matters
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see https://www.gnu.org/licenses/.
 */
import React, { createRef, useEffect } from 'react';

import { SnackbarProvider } from 'notistack';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';

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
          sx={{ width: '90%' }}
        >
          {t(notification.content, notification.params)}
        </Alert>
      )}
    >
      {children}
    </SnackbarProvider>
  );
};

export default NotificationsWrapper;
