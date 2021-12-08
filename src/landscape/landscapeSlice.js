import { createSlice } from '@reduxjs/toolkit'

import { createAsyncThunk } from 'state/utils'
import * as landscapeService from 'landscape/landscapeService'

const initialState = {
  landscape: {
    fetching: true,
    message: null,
    data: null
  }
}

export const fetchLandscape = createAsyncThunk('landscape/fetchLandscape', landscapeService.fetchLandscape)
export const saveLandscape = createAsyncThunk('landscape/saveLandscape', landscapeService.saveLandscape)

const landscapeSlice = createSlice({
  name: 'landscape',
  initialState,
  reducers: {
    setFormNewValues: state => ({
      ...state,
      landscape: {
        ...state.landscape,
        data: null,
        fetching: false
      }
    })
  },
  extraReducers: {
    [fetchLandscape.pending]: state => ({
      ...state,
      landscape: initialState.landscape
    }),
    [fetchLandscape.fulfilled]: (state, action) => ({
      ...state,
      landscape: {
        fetching: false,
        message: null,
        data: action.payload
      }
    }),
    [fetchLandscape.rejected]: (state, action) => ({
      ...state,
      landscape: {
        ...state.landscape,
        fetching: false,
        message: {
          severity: 'error',
          content: action.payload
        }
      }
    }),
    [saveLandscape.pending]: state => ({
      ...state,
      landscape: {
        ...state.landscape,
        fetching: true
      }
    }),
    [saveLandscape.fulfilled]: (state, action) => ({
      ...state,
      landscape: {
        ...state.landscape,
        fetching: false,
        data: action.payload,
        message: {
          severity: 'success',
          content: 'landscape.form_message_success'
        }
      }
    }),
    [saveLandscape.rejected]: (state, action) => ({
      ...state,
      landscape: {
        ...state.landscape,
        fetching: false,
        message: {
          severity: 'error',
          content: action.payload
        }
      }
    })
  }
})

export const {
  setFormNewValues
} = landscapeSlice.actions

export default landscapeSlice.reducer
