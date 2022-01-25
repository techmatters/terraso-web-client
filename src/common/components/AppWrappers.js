import React from 'react';
import { ThemeProvider } from '@mui/material';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';

import NotificationsWrapper from 'notifications/NotificationsWrapper';
import { PermissionsProvider } from 'permissions';
import { RollbarProvider } from 'monitoring/rollbar';

// Localization
import 'localization/i18n';

// Form validations
import 'forms/yup';

// Wrappers
// Router, Theme, Global State, Permissions, Notifications
const AppWrappers = ({ children, theme, store, permissionsRules }) => (
  <RollbarProvider>
    <React.StrictMode>
      <BrowserRouter>
        <ThemeProvider theme={theme}>
          <Provider store={store}>
            <PermissionsProvider rules={permissionsRules}>
              <NotificationsWrapper>{children}</NotificationsWrapper>
            </PermissionsProvider>
          </Provider>
        </ThemeProvider>
      </BrowserRouter>
    </React.StrictMode>
  </RollbarProvider>
);

export default AppWrappers;
