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

import { forwardRef, useEffect } from 'react';
import _ from 'lodash/fp';
import { SnackbarProvider, useSnackbar } from 'notistack';
import { Trans } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { removeMessage } from 'terraso-client-shared/notifications/notificationsSlice';
import { Alert } from '@mui/material';

const MAX_NOTIFICATIONS = 3;
const AUTO_HIDE_DURATION = 10000;

const NotificationsState = () => {
  const dispatch = useDispatch();
  const { enqueueSnackbar } = useSnackbar();
  const messages = useSelector(_.get('notifications.messages'));

  useEffect(() => {
    const shownMessage = Object.keys(messages).map(messageKey => {
      enqueueSnackbar({ message: messages[messageKey], variant: 'default' });
      return messageKey;
    });
    shownMessage.forEach(key => {
      dispatch(removeMessage(key));
    });
  }, [messages, enqueueSnackbar, dispatch]);
  return null;
};

const Notification = forwardRef((props, ref) => {
  const { closeSnackbar } = useSnackbar();
  const { id, message, style } = props;
  const { severity, content, params } = message;

  return (
    <Alert
      onClose={() => closeSnackbar(id)}
      severity={severity}
      ref={ref}
      style={style}
    >
      <Trans i18nKey={content} values={params} />
    </Alert>
  );
});

const NotificationsWrapper = props => {
  const { children } = props;

  return (
    <SnackbarProvider
      preventDuplicate
      maxSnack={MAX_NOTIFICATIONS}
      autoHideDuration={AUTO_HIDE_DURATION}
      anchorOrigin={{
        vertical: 'top',
        horizontal: 'center',
      }}
      Components={{
        default: Notification,
      }}
    >
      <NotificationsState />
      {children}
    </SnackbarProvider>
  );
};

export default NotificationsWrapper;
