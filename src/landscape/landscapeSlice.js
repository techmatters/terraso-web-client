import { createSlice } from '@reduxjs/toolkit'

import { createAsyncThunk } from 'state/utils'
import * as landscapeService from 'landscape/landscapeService'

const initialState = {
  form: {
    landscape: null,
    fetching: true,
    message: null
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
      form: {
        ...state.form,
        landscape: null,
        fetching: false
      }
    })
  },
  extraReducers: {
    [fetchLandscape.pending]: state => ({
      ...state,
      form: initialState.form
    }),
    [fetchLandscape.fulfilled]: (state, action) => ({
      ...state,
      form: {
        fetching: false,
        message: null,
        landscape: action.payload
      }
    }),
    [fetchLandscape.rejected]: (state, action) => ({
      ...state,
      form: {
        ...state.form,
        fetching: false,
        message: {
          severity: 'error',
          content: action.payload
        }
      }
    }),
    [saveLandscape.pending]: state => ({
      ...state,
      form: {
        ...state.form,
        fetching: true
      }
    }),
    [saveLandscape.fulfilled]: (state, action) => ({
      ...state,
      form: {
        ...state.form,
        fetching: false,
        landscape: action.payload,
        message: {
          severity: 'success',
          content: 'landscape.form_message_success'
        }
      }
    }),
    [saveLandscape.rejected]: (state, action) => ({
      ...state,
      form: {
        ...state.form,
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
