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
import jwt from 'jwt-decode';
import { UNAUTHENTICATED } from 'terrasoApi/shared/account/authConstants';
import { getAPIConfig } from 'terrasoApi/shared/config';

type AccessToken = {
  email: string;
};

export const getToken = () => getAPIConfig().tokenStorage.getToken('atoken');

export const getAuthHeaders = (): Record<string, string> => {
  const token = getToken();
  if (!token) {
    return {};
  }
  return {
    Authorization: `Bearer ${token}`,
  };
};

export const removeToken = () => {
  getAPIConfig().tokenStorage.removeToken('rtoken');
  getAPIConfig().tokenStorage.removeToken('atoken');
};

export const refreshToken = async () => {
  const response = await fetch(
    new URL('/auth/tokens', getAPIConfig().terrasoAPIURL).href,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        refresh_token: getAPIConfig().tokenStorage.getToken('rtoken'),
      }),
    }
  );

  if (response.status !== 200) {
    await Promise.reject(UNAUTHENTICATED);
  }

  const tokens = await response.json();

  const { access_token: atoken, refresh_token: rtoken } = tokens;

  getAPIConfig().tokenStorage.setToken('rtoken', rtoken);
  getAPIConfig().tokenStorage.setToken('atoken', atoken);
};

export const getUserEmail = () => {
  const token = getToken();
  return token === undefined ? undefined : jwt<AccessToken>(token).email;
};
