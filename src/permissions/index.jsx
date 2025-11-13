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

import React, { useContext, useEffect, useRef, useState } from 'react';
import _ from 'lodash/fp';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router';

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
    return !resource
      ? Promise.resolve(false)
      : ruleResolver({ user, resource });
  };

  return (
    <PermissionsContext.Provider value={{ isAllowedTo }}>
      {children}
    </PermissionsContext.Provider>
  );
};

export const usePermissionRedirect = (permission, resource, path) => {
  const navigate = useNavigate();

  const { loading, allowed } = usePermission(permission, resource);

  useEffect(() => {
    if (loading) {
      return;
    }

    if (!allowed && path) {
      navigate(path);
    }
  }, [allowed, loading, navigate, path]);

  return { loading };
};

export const usePermission = (permission, resource) => {
  const isMounted = useRef(false);
  const [loading, setLoading] = useState(true);
  const [allowed, setAllowed] = useState();
  const { data: user } = useSelector(state => state.account.currentUser);

  const { isAllowedTo } = useContext(PermissionsContext);

  useEffect(() => {
    if (!resource) {
      return;
    }
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

  return { loading, allowed };
};
