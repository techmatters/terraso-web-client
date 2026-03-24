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

import { useEffect, useReducer, useRef } from 'react';
import { fetchUser } from 'terraso-client-shared/account/accountSlice';
import { useDispatch } from 'terraso-web-client/terrasoApi/store';

const initialValidationState = {
  validationAttempted: false,
  validationPending: false,
};

const validationActionTypes = {
  RESET: 'RESET',
  START: 'START',
  FINISH: 'FINISH',
};

const validationReducer = (state, action) => {
  switch (action.type) {
    case validationActionTypes.RESET:
      return initialValidationState;
    case validationActionTypes.START:
      return { validationAttempted: true, validationPending: true };
    case validationActionTypes.FINISH:
      return { validationAttempted: true, validationPending: false };
    default:
      return state;
  }
};

const useValidateTokenUser = ({ hasToken, user }) => {
  const dispatch = useDispatch();
  const activeValidationRequestRef = useRef(null);
  const [{ validationAttempted, validationPending }, dispatchValidationAction] =
    useReducer(validationReducer, initialValidationState);

  useEffect(() => {
    const shouldValidateTokenUser = hasToken && !user;

    if (!shouldValidateTokenUser) {
      dispatchValidationAction({ type: validationActionTypes.RESET });
      return;
    }

    if (activeValidationRequestRef.current) {
      return;
    }

    const clearActiveRequest = request => {
      if (activeValidationRequestRef.current !== request) {
        return;
      }

      activeValidationRequestRef.current = null;
    };

    const isCurrentActiveRequest = request =>
      activeValidationRequestRef.current === request;

    const finishValidationRequest = request => {
      if (!isCurrentActiveRequest(request)) {
        return;
      }

      clearActiveRequest(request);
      dispatchValidationAction({ type: validationActionTypes.FINISH });
    };

    const validationRequest = dispatch(fetchUser());
    activeValidationRequestRef.current = validationRequest;
    dispatchValidationAction({ type: validationActionTypes.START });

    validationRequest.finally(() => {
      finishValidationRequest(validationRequest);
    });

    return () => {
      validationRequest.abort();
      clearActiveRequest(validationRequest);
    };
  }, [dispatch, hasToken, user]);

  return { validationAttempted, validationPending };
};

export default useValidateTokenUser;
