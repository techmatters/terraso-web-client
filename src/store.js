import { configureStore } from '@reduxjs/toolkit'

import userReducer from './user/userSlice'

const createStore = intialState => configureStore({
  reducer: {
    user: userReducer,
  },
  preloadedState: intialState
})

export default createStore
