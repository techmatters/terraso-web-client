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

import { useCallback, useEffect } from 'react';
import _ from 'lodash/fp';
import { useSelector } from 'react-redux';
import { fetchUser, signOut } from 'terraso-client-shared/account/accountSlice';
import { useFetchData } from 'terraso-client-shared/store/utils';
import { useDispatch } from 'terraso-web-client/terrasoApi/store';

import PageLoader from 'terraso-web-client/layout/PageLoader';
import { useCompleteProfile } from 'terraso-web-client/account/accountProfileUtils';

const OptionalAuth = ({ children }) => {
  const dispatch = useDispatch();
  const { data: user, fetching } = useSelector(_.get('account.currentUser'));
  const hasToken = useSelector(_.get('account.hasToken'));

  useCompleteProfile();

  useFetchData(
    useCallback(
      () => (hasToken && !user ? fetchUser() : null),
      [hasToken, user]
    )
  );

  useEffect(() => {
    if (fetching === false && !user && hasToken) {
      dispatch(signOut());
    }
  }, [fetching, user, hasToken, dispatch]);

  if (hasToken && fetching) {
    return <PageLoader />;
  }

  return children;
};

export default OptionalAuth;
