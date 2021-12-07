import React from 'react'
import {
  Routes,
  Route
} from 'react-router-dom'

import RequireAuth from 'auth/RequireAuth'
import Dashboard from 'dashboard/components/Dashboard'
import GroupForm from 'group/components/GroupForm'
import LandscapeForm from 'landscape/components/LandscapeForm'

const RoutesComponent = () => (
  <Routes>
    <Route path='/' element={<RequireAuth children={<Dashboard />} />} />
    <Route path='/group/:id' element={<RequireAuth children={<GroupForm />} />} />
    <Route path='/landscape/:id' element={<RequireAuth children={<LandscapeForm />} />} />
  </Routes>
)

export default RoutesComponent
