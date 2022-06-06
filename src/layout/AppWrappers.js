import React from 'react';

import { PermissionsProvider } from 'permissions';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';

import { ThemeProvider } from '@mui/material';

import ErrorMonitoringProvider from 'monitoring/error';
import NotificationsWrapper from 'notifications/NotificationsWrapper';

import { REACT_APP_BASE_URL } from 'config';

// Localization
import 'localization/i18n';
// Form validations
import 'forms/yup';
// Analytics
import 'monitoring/analytics';

import RefreshProgressProvider from './RefreshProgressProvider';

// Wrappers
// Router, Theme, Global State, Permissions, Notifications

const AppWrappers = ({ children, theme, store, permissionsRules }) => {
  const { t } = useTranslation();

  return (
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
        <HelmetProvider>
          <Helmet>
            <meta name="description" content={t('site.description')} />
            <meta property="og:title" content={document.title} />
            <meta property="og:description" content={t('site.description')} />
            <meta
              property="og:image"
              content={`${REACT_APP_BASE_URL}/favicon.png`}
            />
          </Helmet>
        </HelmetProvider>
      </BrowserRouter>
    </React.StrictMode>
  );
};

export default AppWrappers;
