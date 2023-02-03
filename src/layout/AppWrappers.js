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

import { BreadcrumbsContextProvider } from 'navigation/breadcrumbsContext';

import RefreshProgressProvider from './RefreshProgressProvider';

// Wrappers
// Router, Theme, Global State, Permissions, Notifications, Breadcrumbs
const AppWrappers = ({ children, theme, store, permissionsRules }) => (
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider theme={theme}>
        <ErrorMonitoringProvider>
          <Provider store={store}>
            <RefreshProgressProvider>
              <PermissionsProvider rules={permissionsRules}>
                <NotificationsWrapper>
                  <BreadcrumbsContextProvider>
                    {children}
                  </BreadcrumbsContextProvider>
                </NotificationsWrapper>
              </PermissionsProvider>
            </RefreshProgressProvider>
          </Provider>
        </ErrorMonitoringProvider>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>
);

export default AppWrappers;
