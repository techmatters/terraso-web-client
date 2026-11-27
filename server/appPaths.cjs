/*
 * Copyright © 2026 Technology Matters
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

// Keep in sync with the client routes; Routes.test.jsx checks for drift.
module.exports = [
  '/',
  '/groups',
  '/groups/:slug',
  '/groups/new',
  '/groups/:slug/edit',
  '/groups/:slug/members',
  '/groups/:slug/upload',
  '/groups/:slug/map/new',
  '/groups/:groupSlug/map/:readableId/:configSlug',
  '/groups/:groupSlug/download/:shareUuid',
  '/landscapes/map',
  '/landscapes',
  '/landscapes/new',
  '/landscapes/:slug',
  '/landscapes/:slug/edit',
  '/landscapes/:slug/profile',
  '/landscapes/:slug/profile/edit',
  '/landscapes/:slug/affiliation/edit',
  '/landscapes/:slug/development-strategy/edit',
  '/landscapes/:slug/profile-image/edit',
  '/landscapes/:slug/boundaries',
  '/landscapes/:slug/members',
  '/landscapes/:slug/upload',
  '/landscapes/:slug/map/new',
  '/landscapes/:landscapeSlug/map/:readableId/:configSlug',
  '/landscapes/:landscapeSlug/download/:shareUuid',
  '/notifications/unsubscribe',
  '/tools',
  '/account',
  '/account/auth-callback',
  '/account/profile/:completeProfile',
  '/account/profile',
  '/contact',
  '/tools/story-maps',
  '/tools/story-maps/new',
  ...[
    '/tools/story-maps/:storyMapId',
    '/tools/story-maps/:storyMapId/',
    '/tools/story-maps/:storyMapId/:slug',
  ].flatMap(basePath => [
    `${basePath}/edit`,
    `${basePath}/`,
    `${basePath}/embed`,
  ]),
  '/tools/story-maps/accept',
];
