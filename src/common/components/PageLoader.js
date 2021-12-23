import React from 'react'
import { Backdrop, CircularProgress } from '@mui/material'

const PageLoader = () => (
  <Backdrop
    sx={{ zIndex: theme => theme.zIndex.drawer + 1 }}
    open={true}
  >
    <CircularProgress color="inherit" />
  </Backdrop>
)

export default PageLoader
