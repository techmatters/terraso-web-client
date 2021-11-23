import { configureStore } from '@reduxjs/toolkit'

import userReducer from 'user/userSlice'
import userDashboardReducer from 'dashboard/dashboardSlice'

const createStore = intialState => configureStore({
  reducer: {
    user: userReducer,
    userDashboard: userDashboardReducer
  },
  preloadedState: intialState
})

export default createStore
