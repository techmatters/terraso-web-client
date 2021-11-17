import { createSlice } from '@reduxjs/toolkit'


export const userSlice = createSlice({
  name: 'user',
  initialState: {
    user: {
      'first_name': 'First Name',
      'last_name': 'Last Name',
      'email': 'email@email.org'
    },
    fetching: false,
    error: null
  },
  reducers: {},
})

export default userSlice.reducer
