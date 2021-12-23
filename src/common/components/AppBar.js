import React from 'react'
import useMediaQuery from '@mui/material/useMediaQuery'
import {
  AppBar,
  Toolbar,
  Button,
  Box
} from '@mui/material'
import { Link } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { useTranslation } from 'react-i18next'

import LocalePicker from 'localization/components/LocalePicker'
import { setHasToken } from 'account/accountSlice'
import { removeToken } from 'account/auth'
import theme from 'theme'

import logo from 'assets/logo.svg'
import logoSquare from 'assets/logo-square.svg'

const AppBarComponent = () => {
  const dispatch = useDispatch()
  const { t } = useTranslation()
  const { data: user } = useSelector(state => state.account.currentUser)
  const hasToken = useSelector(state => state.account.hasToken)
  const isSmall = useMediaQuery(theme.breakpoints.down('sm'))

  if (!hasToken || !user) {
    return null
  }

  const onSignOut = () => {
    removeToken()
    dispatch(setHasToken(false))
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
        <Button color="inherit" sx={theme => ({ marginRight: theme.spacing(2) })}
          onClick={onSignOut}
        >
          {t('user.sign_out')}
        </Button>
        <LocalePicker />
      </Toolbar>
    </AppBar>
  )
}

export default AppBarComponent
