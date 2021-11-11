import React from 'react'

import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton
} from '@mui/material'
import MenuIcon from '@mui/icons-material/Menu'

const AppBarComponent = props => (
  <AppBar position="static">
    <Toolbar>
      <IconButton
        size="large"
        edge="start"
        color="inherit"
        aria-label="menu"
        sx={{ mr: 2 }}
      >
        <MenuIcon />
      </IconButton>
      <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
        Terraso
      </Typography>
      <Button color="inherit">Login</Button>
    </Toolbar>
  </AppBar>
)

export default AppBarComponent