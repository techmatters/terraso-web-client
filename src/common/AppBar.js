import React from 'react'
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box
} from '@mui/material'
import { FormattedMessage } from 'react-intl'
import { Link } from 'react-router-dom'
import { useSelector } from 'react-redux'


const AppBarComponent = props => {
  const user = useSelector(state => state.user.user)

  if (!user) {
    return null
  }

  return (
    <AppBar position="static" elevation={0}>
      <Toolbar>
        <Button
          color="inherit"
          component={Link}
          to="/"
        >
          <Typography variant="h6">
            <FormattedMessage id="terraso.title"/>
          </Typography>
        </Button>
        <Box sx={{ flexGrow: 1 }} />
        <Button color="inherit">
          {user.first_name} {user.last_name}
        </Button>
      </Toolbar>
    </AppBar>
  )
}

export default AppBarComponent