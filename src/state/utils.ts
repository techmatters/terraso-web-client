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
import { useEffect } from 'react';

import { createAsyncThunk as createAsyncThunkBase } from '@reduxjs/toolkit';
import _ from 'lodash/fp';
import { useDispatch } from 'react-redux';

import { addMessage } from 'notifications/notificationsSlice';
import { signOut } from 'state/account/accountSlice';
import { refreshToken } from 'state/account/auth';
import { UNAUTHENTICATED } from 'state/account/authConstants';

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
  ];
  return codes =>
    [
      ..._.flatMap(baseCode => _.flatten([codes]).map(baseCode))(baseCodes),
      ...[
        [slice, action, 'unexpected_error'],
        ['common', 'unexpected_error'],
      ],
    ].map(parts => parts.join('.'));
};

export const createAsyncThunk = (
  name,
  action,
  onSuccessMessage,
  dispatchErrorMessage = true,
  onErrorMessage = ({ message }) => message
) => {
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
      const isAborted = _.getOr(false, 'signal.aborted', thunkAPI);
      const parsedErrors = _.flatten([error]).map(error => {
        const baseMessage = _.has('content', error)
          ? { severity: 'error', ...error }
          : { severity: 'error', content: [error], params: { error } };
        return {
          ..._.omit('content', baseMessage),
          content: generateErrorFallbacks(baseMessage.content),
        };
      });

      if (dispatchErrorMessage && !isAborted) {
        parsedErrors.forEach(message =>
          dispatch(addMessage(onErrorMessage({ message, input })))
        );
      }

      return rejectWithValue({ error, parsedErrors });
    }
  });
};

export const useFetchData = dataFetchCallback => {
  const dispatch = useDispatch();
  useEffect(() => {
    const dataFetchRequest = dataFetchCallback();
    if (!dataFetchRequest) {
      return;
    }
    const req = dispatch(dataFetchRequest);
    return () => req.abort();
  }, [dispatch, dataFetchCallback]);
};
