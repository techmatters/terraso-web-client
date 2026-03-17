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

import { StrictMode } from 'react';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router';
import { ThemeProvider } from '@mui/material';

import ErrorMonitoringProvider from 'terraso-web-client/monitoring/error';
import NotificationsWrapper from 'terraso-web-client/notifications/NotificationsWrapper';
import { PermissionsProvider } from 'terraso-web-client/permissions/index';

import { REACT_APP_BASE_URL } from 'terraso-web-client/config';

// Localization
import 'terraso-web-client/localization/i18n';
// Form validations
import 'terraso-web-client/forms/yup';
// Analytics
import 'terraso-web-client/monitoring/analytics';

import { SocialShareContextProvider } from 'terraso-web-client/common/components/SocialShare';
import { ContainerContextProvider } from 'terraso-web-client/layout/Container';
import RefreshProgressProvider from 'terraso-web-client/layout/RefreshProgressProvider';
import { BreadcrumbsContextProvider } from 'terraso-web-client/navigation/breadcrumbsContext';
import { useHasServerSideMetaTags } from 'terraso-web-client/navigation/components/Routes';

const DefaultMetaTags = () => {
  const { t } = useTranslation();
  const hasServerSideMetaTags = useHasServerSideMetaTags();

  if (hasServerSideMetaTags) {
    return null;
  }

  return (
    <Helmet>
      <meta name="description" content={t('site.description')} />
      <meta property="og:title" content={document.title} />
      <meta property="og:description" content={t('site.description')} />
      <meta property="og:image" content={`${REACT_APP_BASE_URL}/favicon.png`} />
    </Helmet>
  );
};

// Wrappers
// Router, Theme, Global State, Permissions, Notifications, Breadcrumbs
const AppWrappers = ({ children, theme, store, permissionsRules }) => {
  return (
    <StrictMode>
      <BrowserRouter>
        <HelmetProvider>
          <ThemeProvider theme={theme}>
            <ErrorMonitoringProvider>
              <Provider store={store}>
                <RefreshProgressProvider>
                  <PermissionsProvider rules={permissionsRules}>
                    <NotificationsWrapper>
                      <BreadcrumbsContextProvider>
                        <SocialShareContextProvider>
                          <ContainerContextProvider>
                            <DefaultMetaTags />
                            {children}
                          </ContainerContextProvider>
                        </SocialShareContextProvider>
                      </BreadcrumbsContextProvider>
                    </NotificationsWrapper>
                  </PermissionsProvider>
                </RefreshProgressProvider>
              </Provider>
            </ErrorMonitoringProvider>
          </ThemeProvider>
        </HelmetProvider>
      </BrowserRouter>
    </StrictMode>
  );
};

export default AppWrappers;
