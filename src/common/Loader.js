import React from 'react'
import { Backdrop, CircularProgress } from '@mui/material'


const Loader = () => (
  <Backdrop
    sx={{ color: 'text.primary', zIndex: theme => theme.zIndex.drawer + 1 }}
    open={true}
  >
    <CircularProgress color="inherit" />
  </Backdrop>
)

export default Loader
