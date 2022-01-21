import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';

import { fetchUser } from 'account/accountSlice';
import PageLoader from 'common/components/PageLoader';

const RequireAuth = ({ children }) => {
  const dispatch = useDispatch();
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

  return user && hasToken ? children : <Navigate to="/account" replace />;
};

export default RequireAuth;
