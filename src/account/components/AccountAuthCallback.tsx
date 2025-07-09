import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { setHasAccessTokenAsync } from 'terraso-client-shared/account/accountSlice';
import { getAPIConfig } from 'terraso-client-shared/config';
import { useDispatch } from 'terrasoApi/store';

type AuthState = {
  atoken: string;
  rtoken: string;
  redirectUrl: string;
};
const AccountAuthCallback = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [searchParams] = useSearchParams();
  const rawState = searchParams.get('state');
  useEffect(() => {
    if (!rawState) {
      navigate('/');
      return;
    }
    const state = JSON.parse(atob(rawState)) as AuthState;
    getAPIConfig().tokenStorage.setToken('atoken', state.atoken);
    getAPIConfig().tokenStorage.setToken('rtoken', state.rtoken);
    dispatch(setHasAccessTokenAsync()).then(() => {
      navigate('/' + state.redirectUrl, { replace: true });
    });
  }, [rawState, navigate, dispatch]);
};

export default AccountAuthCallback;
