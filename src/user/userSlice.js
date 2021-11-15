import { createSlice } from '@reduxjs/toolkit'

import * as userService from './userService'

export const userSlice = createSlice({
  name: 'user',
  initialState: {
    user: {
      'first_name': 'Jose',
      'last_name': 'Buitron',
      'email': 'jose@techmatters.org'
    },
    fetching: false,
    error: null
  },
  reducers: {
    getUserStart: state => ({
      ...state,
      user: null,
      fetching: true 
    }),
    getUserError: (state, action) => ({
      ...state,
      fetching: false,
      error: action.payload
    }),
    getUserSuccess: (state, action) => ({
      ...state,
      fetching: false,
      user: action.payload
    })
  },
})

const {
  getUserStart,
  getUserError,
  getUserSuccess
} = userSlice.actions

export default userSlice.reducer

export const fetchUser = () => dispatch => {
  dispatch(getUserStart())
  userService.fetch()
    .then(user => dispatch(getUserSuccess(user)))
    .catch(error => dispatch(getUserError(error)))
}