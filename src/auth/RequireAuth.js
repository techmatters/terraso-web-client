import React from 'react'
import { Navigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
 
const RequireAuth = ({ children }) => {
  const user = useSelector(state => state.user.user)

  return !!user
    ? children
    : <Navigate to="/login" replace />
}

export default RequireAuth
