import React from 'react'
import { ThemeProvider } from '@mui/material'
import { IntlProvider } from 'react-intl'
import { Provider } from 'react-redux'

// Wrappers
// Localization, Theme, Global State
const AppWrappers = ({ children, localization, theme, store }) => (
  <React.StrictMode>
    <IntlProvider messages={localization.messages} locale={localization.locale}>
      <ThemeProvider theme={theme}>
        <Provider store={store}>
          {children}
        </Provider>
      </ThemeProvider>
    </IntlProvider>
  </React.StrictMode>
)

export default AppWrappers
