import { configureStore } from '@reduxjs/toolkit'

import userReducer from 'user/userSlice'
import userDashboardReducer from 'dashboard/dashboardSlice'
import groupReducer from 'group/groupSlice'

const createStore = intialState => configureStore({
  reducer: {
    user: userReducer,
    userDashboard: userDashboardReducer,
    group: groupReducer
  },
  preloadedState: intialState
})

export default createStore
