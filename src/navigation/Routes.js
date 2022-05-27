import React from 'react';

import { Route, Routes } from 'react-router-dom';

import NotFound from 'layout/NotFound';

import AccountLogin from 'account/components/AccountLogin';
import AccountProfile from 'account/components/AccountProfile';
import RequireAuth from 'account/components/RequireAuth';
import ContactForm from 'contact/ContactForm';
import GroupForm from 'group/components/GroupForm';
import GroupList from 'group/components/GroupList';
import GroupView from 'group/components/GroupView';
import GroupMembers from 'group/membership/components/GroupMembers';
import Home from 'home/components/Home';
import LandscapeBoundariesUpdate from 'landscape/components/LandscapeBoundariesUpdate';
import LandscapeList from 'landscape/components/LandscapeList';
import LandscapeNew from 'landscape/components/LandscapeNew';
import LandscapeUpdateProfile from 'landscape/components/LandscapeUpdateProfile';
import LandscapeView from 'landscape/components/LandscapeView';
import LandscapeMembers from 'landscape/membership/components/LandscapeMembers';
import ToolsList from 'tool/components/ToolList';

const path = (path, Component, auth = true) => ({
  path,
  Component,
  auth,
});

const paths = [
  path('/', Home),
  path('/groups', GroupList),
  path('/groups/new', GroupForm),
  path('/groups/:slug/edit', GroupForm),
  path('/groups/:slug/members', GroupMembers),
  path('/groups/:slug', GroupView),
  path('/landscapes', LandscapeList),
  path('/landscapes/new', LandscapeNew),
  path('/landscapes/:slug/edit', LandscapeUpdateProfile),
  path('/landscapes/:slug/boundaries', LandscapeBoundariesUpdate),
  path('/landscapes/:slug/members', LandscapeMembers),
  path('/landscapes/:slug', LandscapeView),
  path('/tools', ToolsList),
  path('/account', AccountLogin, false),
  path('/account/profile', AccountProfile),
  path('/contact', ContactForm),
  path('*', NotFound),
];

const RoutesComponent = () => (
  <Routes>
    {paths.map(({ path, Component, auth }) => (
      <Route
        key={path}
        path={path}
        element={
          auth ? <RequireAuth children={<Component />} /> : <Component />
        }
      />
    ))}
  </Routes>
);

export default RoutesComponent;
