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
