import React from 'react'
import { ThemeProvider } from '@mui/material'
import { Provider } from 'react-redux'
import { BrowserRouter } from 'react-router-dom'

// Localization
import 'localization/i18n'

// Form validations
import 'forms/yup'

// Wrappers
// Router, Theme, Global State
const AppWrappers = ({ children, localization, theme, store }) => (
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider theme={theme}>
        <Provider store={store}>
          {children}
        </Provider>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>
)

export default AppWrappers
