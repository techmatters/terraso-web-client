import { createSlice } from '@reduxjs/toolkit'

export const userSlice = createSlice({
  name: 'user',
  initialState: {
    user: {
      first_name: 'Jose',
      last_name: 'Buitron',
      email: 'email@email.org'
    },
    fetching: false,
    error: null
  },
  reducers: {}
})

export default userSlice.reducer
