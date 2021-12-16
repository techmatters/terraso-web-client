import React from 'react';
import { ThemeProvider } from '@mui/material';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import NotificationsWrapper from 'notifications/NotificationsWrapper';

// Localization
import 'localization/i18n';

// Form validations
import 'forms/yup';

// Wrappers
// Router, Theme, Global State, Notifications
const AppWrappers = ({ children, theme, store }) => (
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider theme={theme}>
        <Provider store={store}>
          <NotificationsWrapper>
            {children}
          </NotificationsWrapper>
        </Provider>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>
);

export default AppWrappers;
