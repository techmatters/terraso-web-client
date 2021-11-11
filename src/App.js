import React from 'react'

import { Button } from '@mui/material'
import { Link } from 'react-router-dom'

import './App.css'

function App() {
  return (
    <div>
      <Button
        variant="contained"
        component={Link}
        to="/dashboard"
      >
        Dashboard
      </Button>
    </div>
  )
}

export default App
