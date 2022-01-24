import React, { useState, useContext, useEffect, useRef } from 'react';
import _ from 'lodash/fp';
import { useSelector } from 'react-redux';

const defaultBehaviour = {
  isAllowedTo: () => Promise.resolve(false),
};

export const PermissionsContext = React.createContext(defaultBehaviour);

export const PermissionsProvider = ({ rules, children }) => {
  const isAllowedTo = (permission, user, resource) => {
    const ruleResolver = _.getOr(
      defaultBehaviour.isAllowedTo,
      permission,
      rules
    );
    return ruleResolver({ user, resource });
  };

  return (
    <PermissionsContext.Provider value={{ isAllowedTo }}>
      {children}
    </PermissionsContext.Provider>
  );
};

export const usePermission = (permission, resource) => {
  const isMounted = useRef(false);
  const [loading, setLoading] = useState(true);
  const [allowed, setAllowed] = useState();
  const { data: user } = useSelector(state => state.account.currentUser);

  const { isAllowedTo } = useContext(PermissionsContext);

  useEffect(() => {
    isMounted.current = true;
    isAllowedTo(permission, user, resource).then(allowed => {
      if (isMounted.current) {
        setLoading(false);
        setAllowed(allowed);
      }
    });
    return () => {
      isMounted.current = false;
    };
  }, [isAllowedTo, permission, resource, user]);

  return [loading, allowed];
};
