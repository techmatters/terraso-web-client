import React from 'react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';

import { ThemeProvider } from '@mui/material';

import ErrorMonitoringProvider from 'monitoring/error';
import NotificationsWrapper from 'notifications/NotificationsWrapper';
import { PermissionsProvider } from 'permissions';

// Localization
import 'localization/i18n';
// Form validations
import 'forms/yup';
// Analytics
import 'monitoring/analytics';

// Wrappers
// Router, Theme, Global State, Permissions, Notifications
const AppWrappers = ({ children, theme, store, permissionsRules }) => (
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider theme={theme}>
        <ErrorMonitoringProvider>
          <Provider store={store}>
            <PermissionsProvider rules={permissionsRules}>
              <NotificationsWrapper>{children}</NotificationsWrapper>
            </PermissionsProvider>
          </Provider>
        </ErrorMonitoringProvider>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>
);

export default AppWrappers;
