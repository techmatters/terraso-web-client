import React from 'react'

import { Button } from '@mui/material'
import { Link } from 'react-router-dom'
import { FormattedMessage } from 'react-intl'

import './App.css'

function App() {
  return (
    <div style={{padding: '20px'}}>
      <Button
        variant="contained"
        component={Link}
        to="/dashboard"
      >
        <FormattedMessage id="dashboard.title" />
      </Button>
    </div>
  )
}

export default App
