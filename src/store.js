import { configureStore } from '@reduxjs/toolkit'

import userReducer from './user/userSlice'
import dashboardReducer from './dashboard/dashboardSlice'

export default configureStore({
  reducer: {
    user: userReducer,
    dashboard: dashboardReducer
  },
})
