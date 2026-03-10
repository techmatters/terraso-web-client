import { useEffect, useRef } from 'react';
import { fetchUser } from 'terraso-client-shared/account/accountSlice';
import { useDispatch } from 'terraso-web-client/terrasoApi/store';

const useValidateTokenUser = ({ hasToken, user }) => {
  const dispatch = useDispatch();
  const tokenValidationRequest = useRef(null);

  useEffect(() => {
    if (!hasToken || user || tokenValidationRequest.current) {
      return;
    }

    const request = dispatch(fetchUser());
    tokenValidationRequest.current = request;

    request.finally(() => {
      if (tokenValidationRequest.current === request) {
        tokenValidationRequest.current = null;
      }
    });

    return () => {
      request.abort();
      if (tokenValidationRequest.current === request) {
        tokenValidationRequest.current = null;
      }
    };
  }, [dispatch, hasToken, user]);
};

export default useValidateTokenUser;
