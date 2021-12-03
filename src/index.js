import React from 'react'
import ReactDOM from 'react-dom'
import {
  Routes,
  Route
} from 'react-router-dom'
import { Box } from '@mui/material'

import createStore from 'state/store'
import theme from 'theme'
import AppBar from 'common/components/AppBar'
import reportWebVitals from 'monitoring/reportWebVitals'
import RequireAuth from 'auth/RequireAuth'
import AppWrappers from 'common/components/AppWrappers'
import Dashboard from 'dashboard/components/Dashboard'
import GroupForm from 'group/components/GroupForm'

import 'index.css'

ReactDOM.render(
  <AppWrappers store={createStore()} theme={theme}>
    <Box sx={{ flexGrow: 1 }}>
      <AppBar />
      <Box display="flex" width='auto'>
        <Box m="auto" sx={{ maxWidth: '1044px', paddingTop: theme.spacing(2) }}>
          <Routes>
            <Route path='/dashboard' element={<RequireAuth children={<Dashboard />} />} />
            <Route path='/group/:id' element={<RequireAuth children={<GroupForm />} />} />
          </Routes>
        </Box>
      </Box>
    </Box>
  </AppWrappers>,
  document.getElementById('root')
)

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals()
