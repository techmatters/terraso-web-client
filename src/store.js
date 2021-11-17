import { configureStore } from '@reduxjs/toolkit'

import userReducer from './user/userSlice'
import dashboardReducer from './dashboard/dashboardSlice'

const createStore = intialState => configureStore({
  reducer: {
    user: userReducer,
    dashboard: dashboardReducer
  },
  preloadedState: intialState
})

export default createStore
