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
import { matchPath, Route, Routes, useLocation } from 'react-router';

import { withProps } from 'react-hoc';

import NotFound from 'layout/NotFound';
import AccountAuthCallback from 'account/components/AccountAuthCallback';
import AccountLogin from 'account/components/AccountLogin';
import AccountProfile from 'account/components/AccountProfile';
import OptionalAuth from 'account/components/OptionalAuth';
import RequireAuth from 'account/components/RequireAuth';
import Unsubscribe from 'account/components/Unsubscribe';
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
import LandscapeMapEmbed from 'landscape/components/LandscapeMapEmbed';
import LandscapeProfile from 'landscape/components/LandscapeProfile';
import LandscapeSharedDataUpload from 'landscape/components/LandscapeSharedDataUpload';
import LandscapeSharedDataVisualization from 'landscape/components/LandscapeSharedDataVisualization';
import LandscapeSharedDataVisualizationConfig from 'landscape/components/LandscapeSharedDataVisualizationConfig';
import LandscapeView from 'landscape/components/LandscapeView';
import LandscapeMembers from 'landscape/membership/components/LandscapeMembers';
import SharedResourceDownload from 'sharedData/components/SharedResourceDownload';
import StoryMapInvite from 'storyMap/components/StoryMapInvite';
import StoryMapNew from 'storyMap/components/StoryMapNew';
import StoryMapsToolsHome from 'storyMap/components/StoryMapsToolHome';
import StoryMapUpdate from 'storyMap/components/StoryMapUpdate';
import UserStoryMap from 'storyMap/components/UserStoryMap';
import UserStoryMapEmbed from 'storyMap/components/UserStoryMapEmbed';
import ToolsList from 'tool/components/ToolList';

const path = (
  path,
  Component,
  {
    auth = true,
    optionalAuth = {
      enabled: false,
      message: null,
      isEmbedded: false,
    },
    showBreadcrumbs = false,
    ...otherParams
  } = {}
) => ({
  path,
  Component,
  auth,
  optionalAuth,
  showBreadcrumbs,
  ...otherParams,
});

const paths = [
  path('/', Home),
  path('/groups', GroupList, {
    breadcrumbsLabel: 'group.home_title',
  }),
  path('/groups/:slug', GroupView, {
    showBreadcrumbs: true,
    breadcrumbsLabel: 'group.breadcrumbs_view',
    optionalAuth: {
      enabled: true,
    },
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
  path(
    '/groups/:groupSlug/map/:readableId/:configSlug',
    GroupSharedDataVisualization,
    {
      showBreadcrumbs: true,
      breadcrumbsLabel: 'group.breadcrumbs_visualization',
    }
  ),
  path(
    '/groups/:groupSlug/download/:shareUuid',
    withProps(SharedResourceDownload, { entityType: 'group' }),
    {
      optionalAuth: {
        enabled: true,
        topMessage:
          'sharedData.shared_resource_download_optional_auth_top_message',
      },
    }
  ),
  path('/landscapes/map', LandscapeMapEmbed, {
    optionalAuth: {
      enabled: true,
      isEmbedded: true,
    },
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
    optionalAuth: {
      enabled: true,
    },
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
    '/landscapes/:landscapeSlug/map/:readableId/:configSlug',
    LandscapeSharedDataVisualization,
    {
      showBreadcrumbs: true,
      breadcrumbsLabel: 'landscape.breadcrumbs_visualization',
    }
  ),
  path(
    '/landscapes/:landscapeSlug/download/:shareUuid',
    withProps(SharedResourceDownload, { entityType: 'landscape' }),
    {
      optionalAuth: {
        enabled: true,
        topMessage:
          'sharedData.shared_resource_download_optional_auth_top_message',
      },
    }
  ),
  path('/notifications/unsubscribe', Unsubscribe, {
    optionalAuth: {
      enabled: true,
    },
  }),
  path('/tools', ToolsList, {
    breadcrumbsLabel: 'tools.breadcrumbs_list',
  }),
  path('/account', AccountLogin, { auth: false }),
  path('/account/auth-callback', AccountAuthCallback, { auth: false }),
  path('/account/profile/:completeProfile', AccountProfile),
  path('/account/profile', AccountProfile),
  path('/contact', ContactForm),
  path('/tools/story-maps', StoryMapsToolsHome, {
    showBreadcrumbs: true,
    breadcrumbsLabel: 'storyMap.breadcrumbs_tool_home',
  }),
  path('/tools/story-maps/new', StoryMapNew),
  ...[
    '/tools/story-maps/:storyMapId',
    '/tools/story-maps/:storyMapId/',
    '/tools/story-maps/:storyMapId/:slug',
  ].flatMap(basePath => [
    path(`${basePath}/edit`, StoryMapUpdate),
    path(`${basePath}/`, UserStoryMap, {
      showBreadcrumbs: true,
      breadcrumbsLabel: 'storyMap.breadcrumbs_view',
      breadcrumbsShareProps: {
        bgColor: 'white',
        marginTop: 0,
      },
      optionalAuth: {
        enabled: true,
        topMessage: 'storyMap.optional_auth_top_message',
        bottomMessage: 'storyMap.optional_auth_bottom_message',
      },
    }),
    path(`${basePath}/embed`, UserStoryMapEmbed, {
      optionalAuth: {
        enabled: true,
        isEmbedded: true,
      },
    }),
  ]),
  path('/tools/story-maps/accept', StoryMapInvite),
  path('*', NotFound),
];

const getPath = to => paths.find(path => matchPath({ path: path.path }, to));

export const usePathParams = () => {
  const { pathname: currentPathname } = useLocation();
  const currentPath = useMemo(
    () => getPath(currentPathname),
    [currentPathname]
  );

  return currentPath;
};

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

export const useOptionalAuth = () => {
  const { pathname: currentPathname } = useLocation();
  const currentPath = useMemo(
    () => getPath(currentPathname),
    [currentPathname]
  );

  return currentPath.optionalAuth;
};

const RoutesComponent = () => (
  <Routes>
    {paths.map(({ path, Component, auth, optionalAuth }) => (
      <Route
        key={path}
        path={path}
        element={
          optionalAuth?.enabled ? (
            <OptionalAuth children={<Component />} />
          ) : auth ? (
            <RequireAuth children={<Component />} />
          ) : (
            <Component />
          )
        }
      />
    ))}
  </Routes>
);

export default RoutesComponent;
