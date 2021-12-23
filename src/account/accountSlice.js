import Cookies from 'js-cookie'
import { createSlice } from '@reduxjs/toolkit'

import { createAsyncThunk } from 'state/utils'
import * as accountService from 'account/accountService'

const initialState = {
  currentUser: {
    fetching: true,
    data: null
  },
  login: {
    urls: null,
    fetching: true
  },
  hasToken: !!Cookies.get('token')
}

// TODO hook with proper backend query
export const fetchUser = createAsyncThunk('account/fetchUser', () =>
  (new Promise((resolve) => setTimeout(() => { resolve() }, 500))).then(() => ({
    firstName: 'John',
    lastName: 'Doe',
    email: 'user01@gmail.com'
  }))
)
export const fetchAuthURLs = createAsyncThunk('account/fetchUser', accountService.getAuthURLs)

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
        data: action.payload
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
        urls: null
      }
    })
  }
})

export const {
  setUser,
  setHasToken
} = userSlice.actions

export default userSlice.reducer
