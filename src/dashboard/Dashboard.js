import React from 'react'
import { Typography, Alert } from '@mui/material'
import { FormattedMessage } from 'react-intl'

import './Dashboard.css'

const Dashboard = props => {
    return (
      <div className='Dashboard-container'>
        <Typography variant="h1" component="div" gutterBottom>
          <FormattedMessage id="dashboard.page_title" />
        </Typography>
        <Alert severity="success">
          <FormattedMessage id="user.account_created_message"/>
        </Alert>
      </div>
    )
}

export default Dashboard