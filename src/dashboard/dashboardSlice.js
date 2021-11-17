import { createSlice } from '@reduxjs/toolkit'

import * as dashboardService from './dashboardService'

const initialState = {
  groups: [],
  landscapes: [],
  fetching: true,
  error: null
} 

export const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState,
  reducers: {
    getDashboardDataStart: () => initialState,
    getDashboardDataError: (state, action) => ({
      ...state,
      fetching: false,
      error: action.payload
    }),
    getDashboardDataSuccess: (state, action) => ({
      ...state,
      fetching: false,
      error: null,
      groups: action.payload.groups,
      landscapes: action.payload.landscapes
    })
  },
})

const {
  getDashboardDataStart,
  getDashboardDataError,
  getDashboardDataSuccess
} = dashboardSlice.actions

export default dashboardSlice.reducer

export const fetchDashboardData = () => dispatch => {
  dispatch(getDashboardDataStart())
  dashboardService.fetchDashboardData()
    .then(({ landscapes, groups }) => dispatch(getDashboardDataSuccess({ landscapes, groups })))
    .catch(error => dispatch(getDashboardDataError(error)))
}
