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
import { createSlice } from '@reduxjs/toolkit';
import _ from 'lodash/fp';

import logger from 'monitoring/logger';
import { createAsyncThunk } from 'state/utils';

import * as accountService from 'account/accountService';
import { getToken, removeToken } from 'account/auth';

const initialState = {
  currentUser: {
    fetching: true,
    data: null,
  },
  login: {
    urls: {},
    fetching: true,
  },
  hasToken: !!getToken(),
};

export const fetchUser = createAsyncThunk(
  'account/fetchUser',
  accountService.fetchUser
);
export const saveUser = createAsyncThunk(
  'account/saveUser',
  accountService.saveUser,
  () => ({
    severity: 'success',
    content: 'account.save_success',
  })
);
export const fetchAuthURLs = createAsyncThunk(
  'account/fetchAuthURLs',
  accountService.getAuthURLs
);
export const savePreference = createAsyncThunk(
  'account/savePreference',
  accountService.savePreference
);

export const userSlice = createSlice({
  name: 'user',
  initialState,

  reducers: {
    setUser: (state, action) => ({
      ...state,
      user: action.payload,
    }),
    setHasToken: (state, action) => ({
      ...state,
      hasToken: action.payload,
    }),
  },

  extraReducers: builder => {
    builder.addCase(saveUser.pending, state => ({
      ...state,
      currentUser: {
        ...state.currentUser,
        fetching: true,
      },
    }));

    builder.addCase(saveUser.fulfilled, (state, action) => ({
      ...state,
      currentUser: {
        fetching: false,
        data: action.payload,
      },
    }));

    builder.addCase(saveUser.rejected, state => ({
      ...state,
      currentUser: {
        ...state.currentUser,
        fetching: false,
      },
    }));

    builder.addCase(savePreference.fulfilled, (state, action) => ({
      ...state,
      currentUser: {
        fetching: false,
        data: _.set(
          `preferences.${action.payload.key}`,
          action.payload.value,
          state.currentUser.data
        ),
      },
    }));

    builder.addCase(fetchUser.pending, state => ({
      ...state,
      currentUser: initialState.currentUser,
    }));

    builder.addCase(fetchUser.fulfilled, (state, action) => ({
      ...state,
      currentUser: {
        fetching: false,
        data: action.payload,
      },
    }));

    builder.addCase(fetchUser.rejected, state => ({
      ...state,
      currentUser: {
        fetching: false,
        data: null,
      },
    }));

    builder.addCase(fetchAuthURLs.pending, state => ({
      ...state,
      login: initialState.login,
    }));

    builder.addCase(fetchAuthURLs.fulfilled, (state, action) => ({
      ...state,
      login: {
        fetching: false,
        urls: action.payload,
      },
    }));

    builder.addCase(fetchAuthURLs.rejected, state => ({
      ...state,
      login: {
        fetching: false,
        urls: {},
      },
    }));
  },
});

export const { setUser, setHasToken } = userSlice.actions;

export default userSlice.reducer;

export const signOut = () => dispatch => {
  accountService.signOut().catch(error => {
    logger.error('Failed to execute API signout request', error);
  });
  removeToken();
  dispatch(setHasToken(false));
};
