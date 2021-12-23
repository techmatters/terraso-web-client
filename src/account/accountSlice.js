import { createSlice } from '@reduxjs/toolkit'

import { createAsyncThunk } from 'state/utils'
import { getToken } from 'account/auth'
import * as accountService from 'account/accountService'

const initialState = {
  currentUser: {
    fetching: true,
    data: null
  },
  login: {
    urls: {},
    fetching: true
  },
  hasToken: !!getToken()
}

// TODO hook with proper backend query
export const fetchUser = createAsyncThunk('account/fetchUser', accountService.fetchUser)
export const fetchAuthURLs = createAsyncThunk('account/fetchAuthURLs', accountService.getAuthURLs)

export const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setUser: (state, action) => ({
      ...state,
      user: action.payload
    }),
    setHasToken: (state, action) => ({
      ...state,
      hasToken: action.payload
    })
  },
  extraReducers: {
    [fetchUser.pending]: state => ({
      ...state,
      currentUser: initialState.currentUser
    }),
    [fetchUser.fulfilled]: (state, action) => ({
      ...state,
      currentUser: {
        fetching: false,
        data: {
          email: action.payload.user.email,
          firstName: action.payload.user.first_name,
          lastName: action.payload.user.last_name
        }
      }
    }),
    [fetchUser.rejected]: state => ({
      ...state,
      currentUser: {
        fetching: false,
        data: null
      }
    }),
    [fetchAuthURLs.pending]: state => ({
      ...state,
      login: initialState.login
    }),
    [fetchAuthURLs.fulfilled]: (state, action) => ({
      ...state,
      login: {
        fetching: false,
        urls: action.payload
      }
    }),
    [fetchAuthURLs.rejected]: state => ({
      ...state,
      login: {
        fetching: false,
        urls: {}
      }
    })
  }
})

export const {
  setUser,
  setHasToken
} = userSlice.actions

export default userSlice.reducer
