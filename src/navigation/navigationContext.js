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
import { useCallback, useContext, useEffect, useState } from 'react';

import {
  UNSAFE_NavigationContext as NavigationContext,
  useNavigate,
} from 'react-router-dom';

export const useNavigationBlocker = (when, message) => {
  const navigate = useNavigate();
  const { navigator } = useContext(NavigationContext);
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockedArgs, setBlockedArgs] = useState();

  const unblock = useCallback(() => {
    const to = blockedArgs[0];
    const options = blockedArgs[2];
    navigate(to, {
      ...options,
      force: true,
    });
  }, [blockedArgs, navigate]);
  const cancel = useCallback(() => {
    setIsBlocked(false);
  }, []);

  useEffect(() => {
    if (!when) {
      return;
    }
    const beforeUnload = event => {
      event.preventDefault();
      event.returnValue = message;
    };
    window.addEventListener('beforeunload', beforeUnload);
    const push = navigator.push;

    navigator.push = (...args) => {
      const options = args[2];
      if (options?.force) {
        push(...args);
        return;
      }

      setIsBlocked(true);
      setBlockedArgs(args);
    };

    return () => {
      window.removeEventListener('beforeunload', beforeUnload);
      navigator.push = push;
    };
  }, [when, message, navigator]);

  return { isBlocked, unblock, cancel };
};
