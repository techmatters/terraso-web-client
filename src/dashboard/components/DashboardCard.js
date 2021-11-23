import React from 'react'
import { Card } from '@mui/material'

import theme from 'theme'

const DashboardCard = props => (
  <Card
    {...props}
    sx={{
      display: 'flex',
      padding: theme.spacing(2),
      ...(props.sx || {})
    }}
  >
    {props.children}
  </Card>
)

export default DashboardCard
