import React, { useCallback } from 'react';

import _ from 'lodash/fp';
import { useSelector } from 'react-redux';
import { Navigate, useLocation } from 'react-router-dom';

import PageLoader from 'layout/PageLoader';
import { useFetchData } from 'state/utils';

import { fetchUser } from 'account/accountSlice';

const RequireAuth = ({ children }) => {
  const location = useLocation();
  const { data: user, fetching } = useSelector(
    state => state.account.currentUser
  );
  const hasToken = useSelector(state => state.account.hasToken);

  useFetchData(
    useCallback(
      () => (hasToken && !user ? fetchUser() : null),
      [hasToken, user]
    )
  );

  if (hasToken && fetching) {
    return <PageLoader />;
  }

  const validUser = user && hasToken;
  if (validUser) {
    return children;
  }

  const path = _.getOr('', 'pathname', location);
  const queryParams = _.get('search', location);
  const referrer = [path.substring(1), queryParams]
    .filter(part => part)
    .join('');

  const to = referrer ? `/account?referrer=${referrer}` : '/account';
  return <Navigate to={to} replace />;
};

export default RequireAuth;
