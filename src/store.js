import { configureStore } from '@reduxjs/toolkit'

import userReducer from 'user/userSlice'
import userDashboardReducer from 'user/dashboard/dashboardSlice'


const createStore = intialState => configureStore({
  reducer: {
    user: userReducer,
    userDashboard: userDashboardReducer
  },
  preloadedState: intialState
})

export default createStore
