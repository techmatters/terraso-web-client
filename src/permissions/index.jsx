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

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import _ from 'lodash/fp';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router';

const defaultBehaviour = {
  isAllowedTo: () => false,
};

export const PermissionsContext = createContext(defaultBehaviour);

export const PermissionsProvider = ({ rules, children }) => {
  const isAllowedTo = useCallback(
    (permission, user, resource) => {
      const ruleResolver = _.getOr(
        defaultBehaviour.isAllowedTo,
        permission,
        rules
      );
      return !resource ? false : ruleResolver({ user, resource });
    },
    [rules]
  );

  const value = useMemo(() => ({ isAllowedTo }), [isAllowedTo]);

  return (
    <PermissionsContext.Provider value={value}>
      {children}
    </PermissionsContext.Provider>
  );
};

export const usePermissionRedirect = (permission, resource, path) => {
  const navigate = useNavigate();

  const { loading, allowed, evaluated } = usePermission(permission, resource);

  useEffect(() => {
    if (loading || !resource || !evaluated) {
      return;
    }

    if (!allowed && path) {
      navigate(path);
    }
  }, [allowed, evaluated, loading, navigate, path, resource]);

  return { loading };
};

export const usePermission = (permission, resource) => {
  const [loading, setLoading] = useState(true);
  const [allowed, setAllowed] = useState();
  const [evaluated, setEvaluated] = useState(false);
  const { data: user } = useSelector(state => state.account.currentUser);

  const { isAllowedTo } = useContext(PermissionsContext);

  const permissionResult = useMemo(() => {
    if (!resource) {
      return { type: 'none' };
    }

    const result = isAllowedTo(permission, user, resource);

    if (result && typeof result.then === 'function') {
      return { type: 'async', result };
    }

    return { type: 'sync', allowed: Boolean(result) };
  }, [isAllowedTo, permission, resource, user]);

  useEffect(() => {
    if (permissionResult.type !== 'async') {
      return;
    }

    let isMounted = true;
    setLoading(true);
    setEvaluated(false);

    permissionResult.result.then(nextAllowed => {
      if (isMounted) {
        setLoading(false);
        setAllowed(Boolean(nextAllowed));
        setEvaluated(true);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [permissionResult]);

  if (permissionResult.type === 'none') {
    return { loading: false, allowed: false, evaluated: false };
  }

  if (permissionResult.type === 'sync') {
    return {
      loading: false,
      allowed: permissionResult.allowed,
      evaluated: true,
    };
  }

  return { loading, allowed, evaluated };
};
