import { createSlice } from '@reduxjs/toolkit'

import { createAsyncThunk } from 'state/utils'

const initialState = {
  currentUser: {
    fetching: true,
    data: null
  }
}

// TODO hook with proper backend query
export const fetchUser = createAsyncThunk('account/fetchUser', () =>
  (new Promise((resolve) => setTimeout(() => { resolve() }, 500))).then(() => ({
    firstName: 'John',
    lastName: 'Doe',
    email: 'user01@gmail.com'
  }))
)

export const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setUser: (state, action) => ({
      ...state,
      user: action.payload
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
    })
  }
})

export const {
  setUser
} = userSlice.actions

export default userSlice.reducer
