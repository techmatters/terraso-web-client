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
import * as accountService from 'state/account/accountService';
import { getToken, removeToken } from 'state/account/auth';
import { createAsyncThunk } from 'state/utils';

const initialState = {
  currentUser: {
    fetching: true,
    data: null,
  },
  profile: {
    fetching: true,
    data: null,
  },
  login: {
    urls: {},
    fetching: true,
  },
  hasToken: !!getToken(),
  preferences: {
    saving: false,
    success: false,
    error: null,
  },
  unsubscribe: {
    processing: false,
    success: false,
    error: null,
  },
};

export const fetchUser = createAsyncThunk(
  'state/account/fetchUser',
  accountService.fetchUser
);
export const fetchProfile = createAsyncThunk(
  'state/account/fetchProfile',
  accountService.fetchProfile
);
export const saveUser = createAsyncThunk(
  'state/account/saveUser',
  accountService.saveUser,
  () => ({
    severity: 'success',
    content: 'account.save_success',
  })
);
export const fetchAuthURLs = createAsyncThunk(
  'state/account/fetchAuthURLs',
  accountService.getAuthURLs
);
export const savePreference = createAsyncThunk(
  'state/account/savePreference',
  accountService.savePreference,
  null,
  false
);
export const unsubscribeFromNotifications = createAsyncThunk(
  'state/account/unsubscribeFromNotifications',
  accountService.unsubscribeFromNotifications,
  null,
  false
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
      preferences: {
        saving: false,
        success: true,
        error: null,
      },
      currentUser: {
        fetching: false,
        data: _.set(
          `preferences.${action.payload.key}`,
          action.payload.value,
          state.currentUser.data
        ),
      },
    }));

    builder.addCase(
      savePreference.pending,
      _.set('preferences', {
        saving: true,
        success: false,
        error: null,
      })
    );

    builder.addCase(savePreference.rejected, (state, action) =>
      _.set(
        'preferences',
        {
          saving: false,
          success: false,
          error: action.payload,
        },
        state
      )
    );

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

    builder.addCase(fetchProfile.pending, state => ({
      ...state,
      profile: initialState.profile,
    }));

    builder.addCase(fetchProfile.fulfilled, (state, action) => ({
      ...state,
      profile: {
        fetching: false,
        data: action.payload,
      },
    }));

    builder.addCase(fetchProfile.rejected, state => ({
      ...state,
      profile: {
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

    builder.addCase(
      unsubscribeFromNotifications.pending,
      _.set('unsubscribe', { processing: true, success: false, error: null })
    );
    builder.addCase(unsubscribeFromNotifications.rejected, (state, action) =>
      _.set(
        'unsubscribe',
        { processing: false, success: false, error: action.payload },
        state
      )
    );
    builder.addCase(
      unsubscribeFromNotifications.fulfilled,
      _.set('unsubscribe', { processing: false, success: true, error: null })
    );
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
