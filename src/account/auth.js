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
import Cookies from 'js-cookie';
import jwt from 'jwt-decode';

import { UNAUTHENTICATED } from 'account/authConstants';

import { COOKIES_DOMAIN, TERRASO_API_URL } from 'config';

const COOKIES_PARAMS = { path: '/', domain: COOKIES_DOMAIN };

export const getToken = () => Cookies.get('atoken');

export const removeToken = () => {
  Cookies.remove('rtoken', COOKIES_PARAMS);
  Cookies.remove('atoken', COOKIES_PARAMS);
};

export const refreshToken = async () => {
  const response = await fetch(new URL('/auth/tokens', TERRASO_API_URL).href, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: Cookies.get('rtoken') }),
  });

  if (response.status !== 200) {
    await Promise.reject(UNAUTHENTICATED);
  }

  const tokens = await response.json();

  const { access_token: atoken, refresh_token: rtoken } = tokens;

  Cookies.set('rtoken', rtoken, COOKIES_PARAMS);
  Cookies.set('atoken', atoken, COOKIES_PARAMS);
};

export const getUserEmail = () => jwt(Cookies.get('atoken')).email;
