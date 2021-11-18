import React from 'react'
import ReactDOM from 'react-dom'
import {
  BrowserRouter,
  Routes,
} from 'react-router-dom'
import { Box } from '@mui/material'

import createStore from 'store'
import theme from 'theme'
import AppBar from 'common/components/AppBar'
import reportWebVitals from 'monitoring/reportWebVitals'
import * as localizationService from 'localization/localizationService'
import AppWrappers from 'common/components/AppWrappers'

import './index.css'


// Localization
var locale = navigator.language || navigator.userLanguage

ReactDOM.render(
  <AppWrappers
    localization={{
      locale,
      messages: localizationService.getLocaleValues(locale)
    }}
    store={createStore()}
    theme={theme}
  >
    <Box sx={{ flexGrow: 1 }}>
      <BrowserRouter>
        <AppBar />
        <Box
          display="flex" 
          width='auto'
        >
          <Box m="auto" sx={{ maxWidth: '1044px', paddingTop: theme.spacing(2) }}>
            <Routes>
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
