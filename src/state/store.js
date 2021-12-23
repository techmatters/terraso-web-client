import { configureStore } from '@reduxjs/toolkit'

import accountReducer from 'account/accountSlice'
import userDashboardReducer from 'dashboard/dashboardSlice'
import groupReducer from 'group/groupSlice'
import landscapeReducer from 'landscape/landscapeSlice'
import notificationsReducer from 'notifications/notificationsSlice'

const createStore = intialState => configureStore({
  reducer: {
    account: accountReducer,
    userDashboard: userDashboardReducer,
    group: groupReducer,
    landscape: landscapeReducer,
    notifications: notificationsReducer
  },
  preloadedState: intialState
})

export default createStore
