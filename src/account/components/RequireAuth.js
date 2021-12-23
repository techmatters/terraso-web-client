import React, { useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import Cookies from 'js-cookie'
import { Backdrop, CircularProgress } from '@mui/material'

import { fetchUser } from 'account/accountSlice'

const RequireAuth = ({ children }) => {
  const dispatch = useDispatch()
  const { data: user, fetching } = useSelector(state => state.account.currentUser)
  const token = Cookies.get('token')

  useEffect(() => {
    if (token && !user) {
      dispatch(fetchUser())
    }
  }, [token, user, dispatch])

  if (token && fetching) {
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
