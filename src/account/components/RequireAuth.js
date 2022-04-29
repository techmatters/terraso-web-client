import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Navigate, useLocation } from 'react-router-dom';

import _ from 'lodash/fp';

import { fetchUser } from 'account/accountSlice';
import PageLoader from 'layout/PageLoader';

const RequireAuth = ({ children }) => {
  const dispatch = useDispatch();
  const location = useLocation();
  const { data: user, fetching } = useSelector(
    state => state.account.currentUser
  );
  const hasToken = useSelector(state => state.account.hasToken);

  useEffect(() => {
    if (hasToken && !user) {
      dispatch(fetchUser());
    }
  }, [hasToken, user, dispatch]);

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
