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
