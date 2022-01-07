import React from 'react'
import _ from 'lodash'
import { Card } from '@mui/material'

const HomeCard = props => (
  <Card
    {...props}
    sx={{
      display: 'flex',
      ..._.get(props, 'sx', {})
    }}
  >
    {props.children}
  </Card>
)

export default HomeCard
