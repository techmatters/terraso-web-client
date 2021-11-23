import React from 'react'
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box
} from '@mui/material'
import { Link } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'

const AppBarComponent = props => {
  const { t } = useTranslation()
  const user = useSelector(state => state.user.user)

  if (!user) {
    return null
  }

  return (
    <AppBar position="static" >
      <Toolbar>
        <Button
          sx={{ bgcolor: 'gray.mid', color: 'black' }}
          component={Link}
          to="/"
        >
          <Typography variant="h6">
            {t('common.terraso_projectName')}
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
