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

import Cookies from 'js-cookie';
import { getAPIConfig } from 'terraso-client-shared/config';

import { COOKIES_DOMAIN } from 'terraso-web-client/config';

describe('auth token cookie storage', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test.each(['atoken', 'rtoken'])(
    'replaces the host-only %s with a token scoped to the shared cookie domain',
    name => {
      const removeCookie = jest.spyOn(Cookies, 'remove');
      const setCookie = jest.spyOn(Cookies, 'set');

      getAPIConfig().tokenStorage.setToken(name, 'rotated-token');

      expect(removeCookie).toHaveBeenCalledWith(name, {
        path: '/',
        expires: 30,
      });
      expect(setCookie).toHaveBeenCalledWith(name, 'rotated-token', {
        domain: COOKIES_DOMAIN,
        path: '/',
        expires: 30,
      });
      expect(removeCookie.mock.invocationCallOrder[0]).toBeLessThan(
        setCookie.mock.invocationCallOrder[0]
      );
    }
  );
});
