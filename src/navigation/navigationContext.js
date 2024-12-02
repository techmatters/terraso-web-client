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
} from 'react-router';

let originalPush;

export const useNavigationBlocker = (when, message) => {
  const navigate = useNavigate();
  const { navigator } = useContext(NavigationContext);
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockedArgs, setBlockedArgs] = useState();

  /*
   * We store a reference to the original push method (if we don't have one yet),
   * so that we can be sure we're restoring the original when the blocker is
   * disabled or otherwised cleaned up.
   */
  if (!originalPush) {
    originalPush = navigator.push;
  }

  const proceed = useCallback(() => {
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

  const preventNavigation = useCallback(
    event => {
      event.preventDefault();
      event.returnValue = message;
    },
    [message]
  );

  const disable = useCallback(() => {
    window.removeEventListener('beforeunload', preventNavigation);
    navigator.push = originalPush;
  }, [preventNavigation, navigator]);

  useEffect(() => {
    if (!when) {
      setIsBlocked(false);
      return;
    }
    window.addEventListener('beforeunload', preventNavigation);

    navigator.push = (...args) => {
      const options = args[2];
      if (options?.force) {
        originalPush(...args);
        return;
      }

      setIsBlocked(true);
      setBlockedArgs(args);
    };

    return () => {
      disable();
    };
  }, [when, navigator, preventNavigation, disable]);

  return { isBlocked, proceed, cancel, disable };
};
