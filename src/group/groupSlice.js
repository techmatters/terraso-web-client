import { createSlice } from '@reduxjs/toolkit'

// import * as dashboardService from 'dashboard/dashboardService'

const initialState = {
  form: {
    group: null,
    fetching: true,
    error: null
  }
}

export const groupSlice = createSlice({
  name: 'group',
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
  }
})

// const {
//   getDashboardDataStart,
//   getDashboardDataError,
//   getDashboardDataSuccess
// } = groupSlice.actions

export default groupSlice.reducer

// export const fetchDashboardData = () => dispatch => {
//   dispatch(getDashboardDataStart())
//   dashboardService.fetchDashboardData()
//     .then(({ landscapes, groups }) => dispatch(getDashboardDataSuccess({ landscapes, groups })))
//     .catch(error => dispatch(getDashboardDataError(error)))
// }
