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
import GroupSharedDataVisualization from 'group/components/GroupSharedDataVisualization';
import GroupSharedDataVisualizationConfig from 'group/components/GroupSharedDataVisualizationConfig';
import GroupView from 'group/components/GroupView';
import GroupMembers from 'group/membership/components/GroupMembers';
import Home from 'home/components/Home';
import LandscapeBoundariesUpdate from 'landscape/components/LandscapeBoundariesUpdate';
import LandscapeKeyInfoUpdate from 'landscape/components/LandscapeForm/KeyInfoUpdate';
import LandscapeProfileUpdate from 'landscape/components/LandscapeForm/ProfileUpdate';
import LandscapeList from 'landscape/components/LandscapeList';
import LandscapeNew from 'landscape/components/LandscapeNew';
import LandscapeProfile from 'landscape/components/LandscapeProfile';
import LandscapeSharedDataUpload from 'landscape/components/LandscapeSharedDataUpload';
import LandscapeSharedDataVisualization from 'landscape/components/LandscapeSharedDataVisualization';
import LandscapeSharedDataVisualizationConfig from 'landscape/components/LandscapeSharedDataVisualizationConfig';
import LandscapeView from 'landscape/components/LandscapeView';
import LandscapeMembers from 'landscape/membership/components/LandscapeMembers';
import ToolsList from 'tool/components/ToolList';

const path = (
  path,
  Component,
  { auth = true, showBreadcrumbs = false, breadcrumbsLabel } = {}
) => ({
  path,
  Component,
  auth,
  showBreadcrumbs,
  breadcrumbsLabel,
});

const paths = [
  path('/', Home),
  path('/groups', GroupList, {
    breadcrumbsLabel: 'group.home_title',
  }),
  path('/groups/:slug', GroupView, {
    showBreadcrumbs: true,
    breadcrumbsLabel: 'group.breadcrumbs_view',
  }),
  path('/groups/new', GroupForm),
  path('/groups/:slug/edit', GroupForm),
  path('/groups/:slug/members', GroupMembers, {
    showBreadcrumbs: true,
    breadcrumbsLabel: 'group.breadcrumbs_members',
  }),
  path('/groups/:slug/upload', GroupSharedDataUpload, {
    showBreadcrumbs: true,
    breadcrumbsLabel: 'group.breadcrumbs_upload',
  }),
  path('/groups/:slug/map/new', GroupSharedDataVisualizationConfig, {
    showBreadcrumbs: true,
    breadcrumbsLabel: 'group.breadcrumbs_visualization_new',
  }),
  path('/groups/:groupSlug/map/:configSlug', GroupSharedDataVisualization, {
    showBreadcrumbs: true,
    breadcrumbsLabel: 'group.breadcrumbs_visualization',
  }),
  path('/landscapes', LandscapeList, {
    breadcrumbsLabel: 'landscape.home_title',
  }),
  path('/landscapes/new', LandscapeNew),
  path('/landscapes/:slug', LandscapeView, {
    showBreadcrumbs: true,
    breadcrumbsLabel: 'landscape.breadcrumbs_view',
  }),
  path('/landscapes/:slug/edit', LandscapeKeyInfoUpdate),
  path('/landscapes/:slug/profile', LandscapeProfile, {
    showBreadcrumbs: true,
    breadcrumbsLabel: 'landscape.breadcrumbs_profile',
  }),
  path('/landscapes/:slug/profile/edit', LandscapeProfileUpdate),
  path('/landscapes/:slug/boundaries', LandscapeBoundariesUpdate),
  path('/landscapes/:slug/members', LandscapeMembers, {
    showBreadcrumbs: true,
    breadcrumbsLabel: 'landscape.breadcrumbs_members',
  }),
  path('/landscapes/:slug/upload', LandscapeSharedDataUpload, {
    showBreadcrumbs: true,
    breadcrumbsLabel: 'group.breadcrumbs_upload',
  }),
  path('/landscapes/:slug/map/new', LandscapeSharedDataVisualizationConfig, {
    showBreadcrumbs: true,
    breadcrumbsLabel: 'landscape.breadcrumbs_visualization_new',
  }),
  path(
    '/landscapes/:landscapeSlug/map/:configSlug',
    LandscapeSharedDataVisualization,
    {
      showBreadcrumbs: true,
      breadcrumbsLabel: 'landscape.breadcrumbs_visualization',
    }
  ),
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
    if (!currentPath.showBreadcrumbs) {
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
