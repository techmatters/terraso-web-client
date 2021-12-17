import { createSlice } from '@reduxjs/toolkit'

export const userSlice = createSlice({
  name: 'user',
  initialState: {
    user: {
      firstName: 'John',
      lastName: 'Doe',
      email: 'user01@gmail.com'
    },
    fetching: false
  },
  reducers: {
    setUser: (state, action) => ({
      ...state,
      user: action.payload
    })
  }
})

export const {
  setUser
} = userSlice.actions

export default userSlice.reducer
