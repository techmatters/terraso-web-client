import _ from 'lodash/fp';

import { createSlice } from '@reduxjs/toolkit';
import * as accountService from 'account/accountService';
import { getToken, removeToken } from 'account/auth';
import logger from 'monitoring/logger';
import { createAsyncThunk } from 'state/utils';

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
  extraReducers: {
    [saveUser.pending]: state => ({
      ...state,
      currentUser: {
        ...state.currentUser,
        fetching: true,
      },
    }),
    [saveUser.fulfilled]: (state, action) => ({
      ...state,
      currentUser: {
        fetching: false,
        data: action.payload,
      },
    }),
    [saveUser.rejected]: state => ({
      ...state,
      currentUser: {
        ...state.currentUser,
        fetching: false,
      },
    }),
    [savePreference.fulfilled]: (state, action) => ({
      ...state,
      currentUser: {
        fetching: false,
        data: _.set(
          `preferences.${action.payload.key}`,
          action.payload.value,
          state.currentUser.data
        ),
      },
    }),
    [fetchUser.pending]: state => ({
      ...state,
      currentUser: initialState.currentUser,
    }),
    [fetchUser.fulfilled]: (state, action) => ({
      ...state,
      currentUser: {
        fetching: false,
        data: action.payload,
      },
    }),
    [fetchUser.rejected]: state => ({
      ...state,
      currentUser: {
        fetching: false,
        data: null,
      },
    }),
    [fetchAuthURLs.pending]: state => ({
      ...state,
      login: initialState.login,
    }),
    [fetchAuthURLs.fulfilled]: (state, action) => ({
      ...state,
      login: {
        fetching: false,
        urls: action.payload,
      },
    }),
    [fetchAuthURLs.rejected]: state => ({
      ...state,
      login: {
        fetching: false,
        urls: {},
      },
    }),
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
