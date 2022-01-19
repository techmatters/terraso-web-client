import React from 'react'
import { CircularProgress } from '@mui/material'

import { usePermission } from 'permissions'

const Restricted = props => {
  const {
    permission,
    resource,
    FallbackComponent,
    LoadingComponent,
    children
  } = props
  const [loading, allowed] = usePermission(permission, resource)

  if (loading) {
    return LoadingComponent ? <LoadingComponent /> : <CircularProgress />
  }

  if (allowed) {
    return <>{children}</>
  }

  if (!FallbackComponent) {
    return null
  }

  return <FallbackComponent />
}

export default Restricted
