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

import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Navigate, useLocation } from 'react-router';
import { setHasToken } from 'terraso-client-shared/account/accountSlice';
import { useDispatch } from 'terraso-web-client/terrasoApi/store';

import PageLoader from 'terraso-web-client/layout/PageLoader';
import { generateReferrerUrl } from 'terraso-web-client/navigation/navigationUtils';
import { useCompleteProfile } from 'terraso-web-client/account/accountProfileUtils';
import useValidateTokenUser from 'terraso-web-client/account/useValidateTokenUser';

const RequireAuth = ({ children }) => {
  const dispatch = useDispatch();
  const location = useLocation();
  const { data: user, fetching } = useSelector(
    state => state.account.currentUser
  );
  const hasToken = useSelector(state => state.account.hasToken);

  useCompleteProfile();
  const { validationAttempted, validationPending } = useValidateTokenUser({
    hasToken,
    user,
  });

  useEffect(() => {
    if (
      hasToken &&
      validationAttempted &&
      !validationPending &&
      fetching === false &&
      !user
    ) {
      dispatch(setHasToken(false));
    }
  }, [
    dispatch,
    fetching,
    hasToken,
    user,
    validationAttempted,
    validationPending,
  ]);

  if (
    hasToken &&
    !user &&
    (fetching || validationPending || !validationAttempted)
  ) {
    return <PageLoader />;
  }

  const validUser = user && hasToken;
  if (validUser) {
    return children;
  }

  const to = generateReferrerUrl('/account', location);

  return <Navigate to={to} replace />;
};

export default RequireAuth;
