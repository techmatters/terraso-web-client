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
  const tokenValidationRequest = useRef(null);
  const [validationAttempted, setValidationAttempted] = useState(false);
  const [validationPending, setValidationPending] = useState(false);

  useEffect(() => {
    if (!hasToken || user) {
      setValidationAttempted(false);
      setValidationPending(false);
      return;
    }

    if (tokenValidationRequest.current) {
      return;
    }

    const request = dispatch(fetchUser());
    tokenValidationRequest.current = request;
    setValidationAttempted(true);
    setValidationPending(true);

    request.finally(() => {
      if (tokenValidationRequest.current === request) {
        tokenValidationRequest.current = null;
      }
      setValidationPending(false);
    });

    return () => {
      request.abort();
      if (tokenValidationRequest.current === request) {
        tokenValidationRequest.current = null;
      }
      setValidationPending(false);
    };
  }, [dispatch, hasToken, user]);

  return { validationAttempted, validationPending };
};

export default useValidateTokenUser;
