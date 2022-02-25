import _ from 'lodash/fp';
import { createAsyncThunk as createAsyncThunkBase } from '@reduxjs/toolkit';

import { addMessage } from 'notifications/notificationsSlice';
import { signOut } from 'account/accountSlice';
import { refreshToken } from 'account/auth';
import { UNAUTHENTICATED } from 'account/authConstants';

const executeAuthRequest = (dispatch, action) =>
  action().catch(async error => {
    if (error !== UNAUTHENTICATED) {
      await Promise.reject(error);
    }
    try {
      await refreshToken();
    } catch {
      // Failed token renew
      dispatch(signOut());
      await Promise.reject('account.unauthenticated_message');
    }
    // Retry request after tokens renewed
    return await action();
  });

const generateErrorFallbacksPartial = name => {
  const [slice, action] = _.split('/', name);
  const baseCodes = [
    code => [slice, action, code],
    code => [slice, code],
    code => [code],
    () => [slice, `${action}_unexpected_error`],
    () => ['common', 'unexpected_error'],
  ];
  return codes =>
    _.flatMap(baseCode => codes.map(code => baseCode(code).join('.')))(
      baseCodes
    );
};

export const createAsyncThunk = (name, action, onSuccessMessage) => {
  const generateErrorFallbacks = generateErrorFallbacksPartial(name);
  return createAsyncThunkBase(name, async (input, thunkAPI) => {
    const { rejectWithValue, dispatch } = thunkAPI;

    const executeAction = async () => {
      const state = thunkAPI.getState();
      const currentUser = _.get('account.currentUser.data', state);
      const result = await action(input, currentUser, thunkAPI);
      if (onSuccessMessage) {
        dispatch(addMessage(onSuccessMessage(result, input)));
      }
      return result;
    };

    try {
      return await executeAuthRequest(dispatch, executeAction);
    } catch (error) {
      const errors = _.isArray(error) ? error : [error];
      errors.forEach(error => {
        const baseMessage = _.has('content', error)
          ? { severity: 'error', ...error }
          : { severity: 'error', content: error, params: { error } };
        const message = {
          ..._.omit('content', baseMessage),
          content: generateErrorFallbacks(
            _.isArray(baseMessage.content)
              ? baseMessage.content
              : [baseMessage.content]
          ),
        };
        dispatch(addMessage(message));
      });

      return rejectWithValue(error);
    }
  });
};
