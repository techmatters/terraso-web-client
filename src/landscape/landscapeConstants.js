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

export const PARTNERSHIP_STATUS_NO = 'no';
export const PARTNERSHIP_STATUS_IN_PROGRESS = 'in-progress';
export const PARTNERSHIP_STATUS_YES = 'yes';

export const ALL_PARTNERSHIP_STATUS = {
  NO: PARTNERSHIP_STATUS_NO,
  IN_PROGRESS: PARTNERSHIP_STATUS_IN_PROGRESS,
  YES: PARTNERSHIP_STATUS_YES,
};

export const MEMBERSHIP_ROLE_MEMBER = 'member';
export const MEMBERSHIP_ROLE_MANAGER = 'manager';

export const ALL_MEMBERSHIP_ROLES = [
  MEMBERSHIP_ROLE_MEMBER,
  MEMBERSHIP_ROLE_MANAGER,
];
