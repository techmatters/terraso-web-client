import React, { useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import Cookies from 'js-cookie'
import { Backdrop, CircularProgress } from '@mui/material'

import { fetchUser } from 'account/accountSlice'

const RequireAuth = ({ children }) => {
  const dispatch = useDispatch()
  const { data: user, fetching } = useSelector(state => state.account.currentUser)
  const hasToken = useSelector(state => state.account.hasToken)
  const token = Cookies.get('token')

  useEffect(() => {
    if (hasToken && !user) {
      dispatch(fetchUser())
    }
  }, [hasToken, user, dispatch])

  if (hasToken && fetching) {
    return (
      <Backdrop
        sx={{ color: 'white', zIndex: theme => theme.zIndex.drawer + 1 }}
        open={true}
      >
        <CircularProgress color="inherit" />
      </Backdrop>
    )
  }

  return user && token
    ? children
    : <Navigate to="/account" replace />
}

export default RequireAuth
