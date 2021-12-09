import React from 'react'
import {
  Routes,
  Route
} from 'react-router-dom'

import RequireAuth from 'auth/RequireAuth'
import Dashboard from 'dashboard/components/Dashboard'
import GroupForm from 'group/components/GroupForm'
import LandscapeForm from 'landscape/components/LandscapeForm'
import LandscapeView from 'landscape/components/LandscapeView'

const RoutesComponent = () => (
  <Routes>
    <Route path='/' element={<RequireAuth children={<Dashboard />} />} />
    <Route path='/group/:id' element={<RequireAuth children={<GroupForm />} />} />
    <Route path='/landscapes/new' element={<RequireAuth children={<LandscapeForm />} />} />
    <Route path='/landscapes/:id/edit' element={<RequireAuth children={<LandscapeForm />} />} />
    <Route path='/landscapes/:id' element={<RequireAuth children={<LandscapeView />} />} />
  </Routes>
)

export default RoutesComponent
