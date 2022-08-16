import React, { useMemo } from 'react';

import { Route, Routes, matchPath, useLocation } from 'react-router-dom';

import NotFound from 'layout/NotFound';

import AccountLogin from 'account/components/AccountLogin';
import AccountProfile from 'account/components/AccountProfile';
import RequireAuth from 'account/components/RequireAuth';
import ContactForm from 'contact/ContactForm';
import GroupForm from 'group/components/GroupForm';
import GroupList from 'group/components/GroupList';
import GroupSharedDataUpload from 'group/components/GroupSharedDataUpload';
import GroupView from 'group/components/GroupView';
import GroupMembers from 'group/membership/components/GroupMembers';
import Home from 'home/components/Home';
import LandscapeBoundariesUpdate from 'landscape/components/LandscapeBoundariesUpdate';
import LandscapeList from 'landscape/components/LandscapeList';
import LandscapeNew from 'landscape/components/LandscapeNew';
import LandscapeSharedDataUpload from 'landscape/components/LandscapeSharedDataUpload';
import LandscapeUpdateProfile from 'landscape/components/LandscapeUpdateProfile';
import LandscapeView from 'landscape/components/LandscapeView';
import LandscapeMembers from 'landscape/membership/components/LandscapeMembers';
import ToolsList from 'tool/components/ToolList';

const path = (path, Component, { auth = true, breadcrumbsLabel } = {}) => ({
  path,
  Component,
  auth,
  breadcrumbsLabel,
});

const paths = [
  path('/', Home),
  path('/groups', GroupList),
  path('/groups/:slug', GroupView, {
    breadcrumbsLabel: 'group.breadcrumbs_view',
  }),
  path('/groups/new', GroupForm),
  path('/groups/:slug/edit', GroupForm),
  path('/groups/:slug/members', GroupMembers, {
    breadcrumbsLabel: 'group.breadcrumbs_members',
  }),
  path('/groups/:slug/upload', GroupSharedDataUpload),
  path('/landscapes', LandscapeList),
  path('/landscapes/new', LandscapeNew),
  path('/landscapes/:slug', LandscapeView, {
    breadcrumbsLabel: 'landscape.breadcrumbs_view',
  }),
  path('/landscapes/:slug/edit', LandscapeUpdateProfile),
  path('/landscapes/:slug/boundaries', LandscapeBoundariesUpdate),
  path('/landscapes/:slug/members', LandscapeMembers, {
    breadcrumbsLabel: 'landscape.breadcrumbs_members',
  }),
  path('/landscapes/:slug/upload', LandscapeSharedDataUpload),
  path('/tools', ToolsList),
  path('/account', AccountLogin, { auth: false }),
  path('/account/profile', AccountProfile),
  path('/contact', ContactForm),
  path('*', NotFound),
];

const getPath = to => paths.find(path => matchPath({ path: path.path }, to));

export const useBreadcrumbs = () => {
  const { pathname: currentPathname } = useLocation();
  const pathnames = useMemo(
    () => currentPathname.split('/'),
    [currentPathname]
  );
  const currentPath = useMemo(
    () => getPath(currentPathname),
    [currentPathname]
  );
  const items = useMemo(() => {
    if (!currentPath.breadcrumbsLabel) {
      return null;
    }
    return pathnames
      .map((item, index) => {
        const to = `/${pathnames.slice(1, index + 1).join('/')}`;
        if (to === currentPathname) {
          return {
            to,
            label: currentPath.breadcrumbsLabel,
            current: true,
          };
        }
        const path = getPath(to);
        if (!path || !path.breadcrumbsLabel) {
          return null;
        }

        return {
          to,
          label: path.breadcrumbsLabel,
        };
      })
      .filter(pathname => pathname);
  }, [pathnames, currentPath, currentPathname]);

  console.log({ items });

  return items;
};

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
