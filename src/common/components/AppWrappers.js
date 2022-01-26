import React from 'react';
import { ThemeProvider } from '@mui/material';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';

import NotificationsWrapper from 'notifications/NotificationsWrapper';
import { PermissionsProvider } from 'permissions';
import ErrorMonitoringProvider from 'monitoring/error';

// Localization
import 'localization/i18n';

// Form validations
import 'forms/yup';

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
