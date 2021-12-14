import React from 'react'
import { Card } from '@mui/material'

const DashboardCard = props => (
  <Card
    {...props}
    sx={{
      display: 'flex',
      ...(props.sx || {})
    }}
  >
    {props.children}
  </Card>
)

export default DashboardCard
