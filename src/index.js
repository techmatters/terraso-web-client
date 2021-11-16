import React from 'react'
import ReactDOM from 'react-dom'
import {
  BrowserRouter,
  Routes,
  Route
} from 'react-router-dom'
import { ThemeProvider } from '@mui/material'
import { Box } from '@mui/material'
import { IntlProvider } from 'react-intl'
import { Provider } from 'react-redux'

import store from './store'
import theme from './theme'
import App from './App'
import AppBar from './common/AppBar'
import reportWebVitals from './reportWebVitals'
import Dashboard from './dashboard/components/Dashboard'
import * as localizationService from './localization/localizationService'
import RequireAuth from './auth/RequireAuth'

import './index.css'

// Localization
var locale = navigator.language || navigator.userLanguage

// Wrappers
// Localization, Theme, Global State
const AppWrappers = ({ children }) => (
  <React.StrictMode>
    <IntlProvider messages={localizationService.getLocaleValues(locale)} locale={locale}>
      <ThemeProvider theme={theme}>
        <Provider store={store}>
          {children}
        </Provider>
      </ThemeProvider>
    </IntlProvider>
  </React.StrictMode>
)

ReactDOM.render(
  <AppWrappers>
    <Box sx={{ flexGrow: 1 }}>
      <BrowserRouter>
        <AppBar />
        <Box
          display="flex" 
          width='auto'
        >
          <Box m="auto" sx={{ maxWidth: '1044px', paddingTop: theme.spacing(2) }}>
            <Routes>
              <Route path='/' element={<App />} />
              <Route path='/dashboard' element={<RequireAuth children={<Dashboard />} />} />
            </Routes>
          </Box>
        </Box>
      </BrowserRouter>
    </Box>
  </AppWrappers>,
  document.getElementById('root')
)

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals()
