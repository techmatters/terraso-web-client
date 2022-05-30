import React from 'react';

import { PermissionsProvider } from 'permissions';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';

import { ThemeProvider } from '@mui/material';

import ErrorMonitoringProvider from 'monitoring/error';
import NotificationsWrapper from 'notifications/NotificationsWrapper';

// Localization
import 'localization/i18n';
// Form validations
import 'forms/yup';
// Analytics
import 'monitoring/analytics';

import RefreshProgressProvider from './RefreshProgressProvider';

// Wrappers
// Router, Theme, Global State, Permissions, Notifications
const AppWrappers = ({ children, theme, store, permissionsRules }) => (
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider theme={theme}>
        <ErrorMonitoringProvider>
          <Provider store={store}>
            <RefreshProgressProvider>
              <PermissionsProvider rules={permissionsRules}>
                <NotificationsWrapper>{children}</NotificationsWrapper>
              </PermissionsProvider>
            </RefreshProgressProvider>
          </Provider>
        </ErrorMonitoringProvider>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>
);

export default AppWrappers;
