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

import App from './App'
import AppBar from './common/AppBar'
import reportWebVitals from './reportWebVitals'
import Dashboard from './dashboard/Dashboard'
import * as localizationService from './localization/localizationService'

import './index.css'

const theme = createTheme({
  palette: {
    type: 'light',
    primary: {
      main: '#5e5547',
    },
    secondary: {
      main: '#f50057',
    },
  },
})

var locale = navigator.language || navigator.userLanguage

ReactDOM.render(
  <React.StrictMode>
    <IntlProvider messages={localizationService.getLocaleValues(locale)} locale={locale}>
      <ThemeProvider theme={theme}>
        <Box sx={{ flexGrow: 1 }}>
          <BrowserRouter>
            <AppBar />
            <Routes>
              <Route path='/' element={<App />} />
              <Route path='/dashboard' element={<Dashboard />} />
            </Routes>
          </BrowserRouter>
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
