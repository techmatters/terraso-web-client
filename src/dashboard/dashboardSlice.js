import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'

import * as dashboardService from 'dashboard/dashboardService'

const initialState = {
  groups: [],
  landscapes: [],
  fetching: true,
  error: null
}

export const fetchDashboardData = createAsyncThunk('dashboard/fetchData', dashboardService.fetchDashboardData)

export const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState,
  reducers: {},
  extraReducers: {
    [fetchDashboardData.pending]: () => initialState,
    [fetchDashboardData.fulfilled]: (state, action) => ({
      ...state,
      fetching: false,
      error: null,
      groups: action.payload.groups,
      landscapes: action.payload.landscapes
    }),
    [fetchDashboardData.rejected]: (state, action) => ({
      ...state,
      fetching: false,
      error: action.error.message
    })
  }
})

export default dashboardSlice.reducer
