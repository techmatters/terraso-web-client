/*
 * Copyright © 2021-2023 Technology Matters
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see https://www.gnu.org/licenses/.
 */
import React, { useMemo } from 'react';

import { Route, Routes, matchPath, useLocation } from 'react-router-dom';
import StoryMapForm from 'storyMap/components/StoryMapForm';

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
import LandscapeAffiliationUpdate from 'landscape/components/LandscapeForm/AffiliationUpdate';
import LandscapeBoundariesUpdate from 'landscape/components/LandscapeForm/BoundaryStepUpdate';
import LandscapeDevelopmentStrategyUpdate from 'landscape/components/LandscapeForm/DevelopmentStrategyUpdate';
import LandscapeKeyInfoUpdate from 'landscape/components/LandscapeForm/KeyInfoUpdate';
import LandscapeNew from 'landscape/components/LandscapeForm/New';
import LandscapeProfileImageUpdate from 'landscape/components/LandscapeForm/ProfileImageUpdate';
import LandscapeProfileUpdate from 'landscape/components/LandscapeForm/ProfileUpdate';
import LandscapeList from 'landscape/components/LandscapeList';
import LandscapeProfile from 'landscape/components/LandscapeProfile';
import LandscapeSharedDataUpload from 'landscape/components/LandscapeSharedDataUpload';
import LandscapeSharedDataVisualization from 'landscape/components/LandscapeSharedDataVisualization';
import LandscapeSharedDataVisualizationConfig from 'landscape/components/LandscapeSharedDataVisualizationConfig';
import LandscapeView from 'landscape/components/LandscapeView';
import LandscapeMembers from 'landscape/membership/components/LandscapeMembers';
import ToolsList from 'tool/components/ToolList';
import UserStoryMap from 'user/components/UserStoryMap';

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
  path('/landscapes/:slug/affiliation/edit', LandscapeAffiliationUpdate),
  path(
    '/landscapes/:slug/development-strategy/edit',
    LandscapeDevelopmentStrategyUpdate
  ),
  path('/landscapes/:slug/profile-image/edit', LandscapeProfileImageUpdate),
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
  path('/story-map/', UserStoryMap),
  path('/story-map-form/', StoryMapForm),
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
