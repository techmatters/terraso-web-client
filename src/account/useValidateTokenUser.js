/*
 * Copyright © 2026 Technology Matters
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

import { useEffect, useRef, useState } from 'react';
import { fetchUser } from 'terraso-client-shared/account/accountSlice';
import { useDispatch } from 'terraso-web-client/terrasoApi/store';

const useValidateTokenUser = ({ hasToken, user }) => {
  const dispatch = useDispatch();
  const activeValidationRequestRef = useRef(null);
  const [validationAttempted, setValidationAttempted] = useState(false);
  const [validationPending, setValidationPending] = useState(false);

  useEffect(() => {
    const shouldValidateTokenUser = hasToken && !user;

    if (!shouldValidateTokenUser) {
      setValidationAttempted(false);
      setValidationPending(false);
      return;
    }

    if (activeValidationRequestRef.current) {
      return;
    }

    const clearActiveRequest = request => {
      if (activeValidationRequestRef.current === request) {
        activeValidationRequestRef.current = null;
      }
    };

    const finishValidationRequest = request => {
      clearActiveRequest(request);
      setValidationPending(false);
    };

    const validationRequest = dispatch(fetchUser());
    activeValidationRequestRef.current = validationRequest;
    setValidationAttempted(true);
    setValidationPending(true);

    validationRequest.finally(() => {
      finishValidationRequest(validationRequest);
    });

    return () => {
      validationRequest.abort();
      finishValidationRequest(validationRequest);
    };
  }, [dispatch, hasToken, user]);

  return { validationAttempted, validationPending };
};

export default useValidateTokenUser;
