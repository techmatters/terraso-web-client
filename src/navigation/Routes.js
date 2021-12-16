import React from 'react'
import {
  Routes,
  Route
} from 'react-router-dom'

import RequireAuth from 'auth/RequireAuth'
import Dashboard from 'dashboard/components/Dashboard'
import GroupForm from 'group/components/GroupForm'
import GroupView from 'group/components/GroupView'
import LandscapeList from 'landscape/components/LandscapeList'
import LandscapeForm from 'landscape/components/LandscapeForm'
import LandscapeView from 'landscape/components/LandscapeView'
import ToolsList from 'tool/components/ToolList'

const RoutesComponent = () => (
  <Routes>
    <Route path='/' element={<RequireAuth children={<Dashboard />} />} />
    <Route path='/groups/new' element={<RequireAuth children={<GroupForm />} />} />
    <Route path='/groups/:slug/edit' element={<RequireAuth children={<GroupForm />} />} />
    <Route path='/groups/:slug' element={<RequireAuth children={<GroupView />} />} />
    <Route path='/landscapes' element={<RequireAuth children={<LandscapeList />} />} />
    <Route path='/landscapes/new' element={<RequireAuth children={<LandscapeForm />} />} />
    <Route path='/landscapes/:slug/edit' element={<RequireAuth children={<LandscapeForm />} />} />
    <Route path='/landscapes/:slug' element={<RequireAuth children={<LandscapeView />} />} />
    <Route path='/tools' element={<RequireAuth children={<ToolsList />} />} />
  </Routes>
)

export default RoutesComponent
