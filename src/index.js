import React from 'react'
import ReactDOM from 'react-dom'
import {
  BrowserRouter,
  Routes,
  Route
} from 'react-router-dom'
import { createTheme } from '@mui/material/styles'
import { ThemeProvider } from '@mui/material'
import { Box } from '@mui/material'
import { IntlProvider } from 'react-intl'
import { Provider } from 'react-redux'

import store from './store'
import App from './App'
import AppBar from './common/AppBar'
import reportWebVitals from './reportWebVitals'
import Dashboard from './dashboard/Dashboard'
import * as localizationService from './localization/localizationService'
import RequireAuth from './auth/RequireAuth'

import './index.css'

// Theme
const theme = createTheme({
  palette: {
    type: 'light',
    primary: {
      main: '#E5E5E5',
    },
    secondary: {
      main: '#f50057',
    },
  },
})

// Localization
var locale = navigator.language || navigator.userLanguage

ReactDOM.render(
  <React.StrictMode>
    <IntlProvider messages={localizationService.getLocaleValues(locale)} locale={locale}>
      <ThemeProvider theme={theme}>
        <Box sx={{ flexGrow: 1 }}>
          <Provider store={store}>
            <BrowserRouter>
              <AppBar />
              <Routes>
                <Route path='/' element={<App />} />
                <Route path='/dashboard' element={
                  <RequireAuth>
                    <Dashboard />
                  </RequireAuth>
                } />
              </Routes>
            </BrowserRouter>
          </Provider>
        </Box>
      </ThemeProvider>
    </IntlProvider>
  </React.StrictMode>,
  document.getElementById('root')
)

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals()
