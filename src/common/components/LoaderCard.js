import React from 'react'
import {
  Box,
  Skeleton,
  Card
} from '@mui/material'

import theme from 'theme'

const LoaderCard = () => (
  <Card
    role="loader"
    sx={{
      display: 'flex',
      flexDirection: 'column',
      padding: theme.spacing(2)
    }}
  >
    <Box sx={{ display: 'flex', marginBottom: theme.spacing(2) }}>
      <Skeleton sx={{ height: 80, width: 80 }} animation="wave" variant="rectangular" />
      <Box sx={{ display: 'flex', flexDirection: 'column', marginLeft: theme.spacing(2) }}>
        <Skeleton animation="wave" height={30} width="150px" />
        <Skeleton animation="wave" height={10} width="250px" />
        <Skeleton animation="wave" height={10} width="250px" />
        <Skeleton animation="wave" height={10} width="250px" />
        <Skeleton animation="wave" height={10} width="250px" />
        <Skeleton animation="wave" height={10} width="150px" />
      </Box>
    </Box>
    <Skeleton sx={{ height: 40 }} animation="wave" variant="rectangular" />
  </Card>
)

export default LoaderCard
