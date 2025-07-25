/*
 * Copyright © 2025 Technology Matters
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

import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { setHasAccessTokenAsync } from 'terraso-client-shared/account/accountSlice';
import { getAPIConfig } from 'terraso-client-shared/config';
import { useDispatch } from 'terrasoApi/store';

import { TERRASO_ENV } from 'config';

type AuthState = {
  atoken: string;
  rtoken: string;
  redirectUrl: string;
};
const AccountAuthCallback = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [searchParams] = useSearchParams();
  const rawState = searchParams.get('state');
  useEffect(() => {
    if (TERRASO_ENV === 'production' || !rawState) {
      navigate('/account');
      return;
    }
    try {
      const state = JSON.parse(atob(rawState)) as AuthState;
      getAPIConfig().tokenStorage.setToken('atoken', state.atoken);
      getAPIConfig().tokenStorage.setToken('rtoken', state.rtoken);
      dispatch(setHasAccessTokenAsync()).then(() => {
        navigate('/' + state.redirectUrl, { replace: true });
      });
    } catch (error) {
      navigate('/account');
    }
  }, [rawState, navigate, dispatch]);

  return null;
};

export default AccountAuthCallback;
