import { createSlice } from '@reduxjs/toolkit';

export const userSlice = createSlice({
  name: 'user',
  initialState: {
    user: {
      firstName: 'Jose',
      lastName: 'Buitron',
      email: 'email@email.org'
    },
    fetching: false
  },
  reducers: {}
});

export default userSlice.reducer;
