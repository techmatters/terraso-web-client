import React from 'react'
import useMediaQuery from '@mui/material/useMediaQuery'
import {
  AppBar,
  Toolbar,
  Button,
  Box
} from '@mui/material'
import { Link } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'

import LocalePicker from 'localization/components/LocalePicker'
import theme from 'theme'

import logo from 'assets/logo.svg'
import logoSquare from 'assets/logo-square.svg'

const AppBarComponent = props => {
  const { t } = useTranslation()
  const user = useSelector(state => state.user.user)
  const isSmall = useMediaQuery(theme.breakpoints.down('sm'))

  if (!user) {
    return null
  }

  return (
    <AppBar position="static" >
      <Toolbar>
        <Button
          color="inherit"
          component={Link}
          to="/"
        >
          <img src={isSmall ? logoSquare : logo} height="35px" alt={t('common.terraso_projectName')} />
        </Button>
        <Box sx={{ flexGrow: 1 }} />
        <Button component={Link} to="/account/profile" color="inherit" sx={{ fontWeight: 500 }}>
          {user.firstName} {user.lastName}
        </Button>
        |
        <Button color="inherit" sx={theme => ({ marginRight: theme.spacing(2) })}>
          {t('user.sign_out')}
        </Button>
        <LocalePicker />
      </Toolbar>
    </AppBar>
  )
}

export default AppBarComponent
