import { createSlice } from '@reduxjs/toolkit'

import { createAsyncThunk } from 'state/utils'
import * as landscapeService from 'landscape/landscapeService'

const initialState = {
  list: {
    fetching: true,
    landscapes: [],
    message: null
  },
  view: {
    fetching: true,
    message: null,
    landscape: null
  },
  form: {
    fetching: true,
    message: null,
    landscape: null
  }
}

export const fetchLandscapes = createAsyncThunk('landscape/fetchLandscapes', landscapeService.fetchLandscapes)
export const fetchLandscapeForm = createAsyncThunk('landscape/fetchLandscapeForm', landscapeService.fetchLandscapeToUpdate)
export const fetchLandscapeView = createAsyncThunk('landscape/fetchLandscapeView', landscapeService.fetchLandscapeToView)
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
    [fetchLandscapes.pending]: state => ({
      ...state,
      list: initialState.list
    }),
    [fetchLandscapes.fulfilled]: (state, action) => ({
      ...state,
      list: {
        fetching: false,
        message: null,
        landscapes: action.payload
      }
    }),
    [fetchLandscapes.rejected]: (state, action) => ({
      ...state,
      list: {
        ...state.list,
        fetching: false,
        message: {
          severity: 'error',
          content: action.payload
        }
      }
    }),
    [fetchLandscapeView.pending]: state => ({
      ...state,
      view: initialState.view
    }),
    [fetchLandscapeView.fulfilled]: (state, action) => ({
      ...state,
      view: {
        fetching: false,
        message: null,
        landscape: action.payload
      }
    }),
    [fetchLandscapeView.rejected]: (state, action) => ({
      ...state,
      view: {
        ...state.view,
        fetching: false,
        message: {
          severity: 'error',
          content: action.payload
        }
      }
    }),
    [fetchLandscapeForm.pending]: state => ({
      ...state,
      form: initialState.form
    }),
    [fetchLandscapeForm.fulfilled]: (state, action) => ({
      ...state,
      form: {
        fetching: false,
        message: null,
        landscape: action.payload
      }
    }),
    [fetchLandscapeForm.rejected]: (state, action) => ({
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
