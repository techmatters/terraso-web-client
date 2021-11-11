import React from 'react'
import { Typography, Alert } from '@mui/material'

import './Dashboard.css'

const Dashboard = props => {
    return (
      <div className='Dashboard-container'>
        <Typography variant="h1" component="div" gutterBottom>
          Your Stuff
        </Typography>
        <Alert severity="success">Your Terraso account has been created successfully with the following information. You can edit them any time.</Alert>
      </div>
    )
}

export default Dashboard