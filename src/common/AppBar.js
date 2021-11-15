import React from 'react'

import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton
} from '@mui/material'
import MenuIcon from '@mui/icons-material/Menu'
import { FormattedMessage } from 'react-intl'
import { Link } from 'react-router-dom'

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
      <Button
        color="inherit"
        component={Link}
        to="/"
        sx={{ flexGrow: 1 }}
      >
        <Typography variant="h6">
          <FormattedMessage id="terraso.title"/>
        </Typography>
      </Button>
      <Button color="inherit">
        <FormattedMessage id="user.login"/>
      </Button>
    </Toolbar>
  </AppBar>
)

export default AppBarComponent