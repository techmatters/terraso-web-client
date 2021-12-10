import React from 'react'
import {
  Routes,
  Route
} from 'react-router-dom'

import RequireAuth from 'auth/RequireAuth'
import Dashboard from 'dashboard/components/Dashboard'
import GroupForm from 'group/components/GroupForm'
import LandscapeList from 'landscape/components/LandscapeList'
import LandscapeForm from 'landscape/components/LandscapeForm'
import LandscapeView from 'landscape/components/LandscapeView'

const RoutesComponent = () => (
  <Routes>
    <Route path='/' element={<RequireAuth children={<Dashboard />} />} />
    <Route path='/group/:id' element={<RequireAuth children={<GroupForm />} />} />
    <Route path='/landscapes' element={<RequireAuth children={<LandscapeList />} />} />
    <Route path='/landscapes/new' element={<RequireAuth children={<LandscapeForm />} />} />
    <Route path='/landscapes/:slug/edit' element={<RequireAuth children={<LandscapeForm />} />} />
    <Route path='/landscapes/:slug' element={<RequireAuth children={<LandscapeView />} />} />
  </Routes>
)

export default RoutesComponent
