import React from 'react'
import { Routes, Route } from 'react-router-dom'

import Dashboard from 'dashboard/components/Dashboard'
import GroupList from 'group/components/GroupList'
import GroupForm from 'group/components/GroupForm'
import GroupView from 'group/components/GroupView'
import LandscapeList from 'landscape/components/LandscapeList'
import LandscapeForm from 'landscape/components/LandscapeForm'
import LandscapeView from 'landscape/components/LandscapeView'
import ToolsList from 'tool/components/ToolList'
import AccountForm from 'account/components/AccountForm'
import AccountProfile from 'account/components/AccountProfile'
import RequireAuth from 'account/components/RequireAuth'

const path = (path, Component, auth = true) => ({
  path, Component, auth
})

const paths = [
  path('/', Dashboard),
  path('/groups', GroupList),
  path('/groups/new', GroupForm),
  path('/groups/:slug/edit', GroupForm),
  path('/groups/:slug', GroupView),
  path('/landscapes', LandscapeList),
  path('/landscapes/new', LandscapeForm),
  path('/landscapes/:slug/edit', LandscapeForm),
  path('/landscapes/:slug', LandscapeView),
  path('/tools', ToolsList),
  path('/account', AccountForm, false),
  path('/account/profile', AccountProfile)
]

const RoutesComponent = () => (
  <Routes>
    {paths.map(({ path, Component, auth }) => (
      <Route
        key={path}
        path={path}
        element={ auth
          ? <RequireAuth children={<Component />} />
          : <Component />
        }
      />
    ))}
  </Routes>
)

export default RoutesComponent
