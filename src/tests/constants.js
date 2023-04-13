/*
 * Copyright © 2023 Technology Matters
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

export const GROUP_TYPES_WITH_REDIRECTS = {
  'Open member': {
    membershipType: 'OPEN',
    userRole: 'MEMBER',
    uploadRedirectCount: 0,
    memberListRedirectCount: 0,
  },
  'Open nonmember': {
    membershipType: 'OPEN',
    userRole: null,
    uploadRedirectCount: 1,
    memberListRedirectCount: 0,
  },
  'Open manager': {
    membershipType: 'OPEN',
    userRole: 'MANAGER',
    uploadRedirectCount: 0,
    memberListRedirectCount: 0,
  },
  'Closed member': {
    membershipType: 'CLOSED',
    userRole: 'MEMBER',
    uploadRedirectCount: 0,
    memberListRedirectCount: 0,
  },
  'Closed nonmember': {
    membershipType: 'CLOSED',
    userRole: null,
    uploadRedirectCount: 1,
    memberListRedirectCount: 1,
  },
  'Closed manager': {
    membershipType: 'CLOSED',
    userRole: 'MANAGER',
    uploadRedirectCount: 0,
    memberListRedirectCount: 0,
  },
};

export const LANDSCAPE_TYPES_WITH_REDIRECTS = {
  Member: {
    userRole: 'MEMBER',
    uploadRedirectCount: 0,
  },
  Manager: {
    userRole: 'MANAGER',
    uploadRedirectCount: 0,
  },
  Nonmember: {
    userRole: null,
    uploadRedirectCount: 1,
  },
};
