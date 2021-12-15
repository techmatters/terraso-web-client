import { createSlice } from '@reduxjs/toolkit'

import { createAsyncThunk } from 'state/utils'
import * as landscapeService from 'landscape/landscapeService'
import { setMemberships } from 'group/groupSlice'
import * as groupUtils from 'group/groupUtils'

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

export const fetchLandscapeForm = createAsyncThunk('landscape/fetchLandscapeForm', landscapeService.fetchLandscapeToUpdate)
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
    }),
    fetchLandscapesPending: state => ({
      ...state,
      list: initialState.list
    }),
    fetchLandscapesRejected: (state, action) => ({
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
    fetchLandscapesFulfilled: (state, action) => ({
      ...state,
      list: {
        fetching: false,
        message: null,
        landscapes: action.payload
      }
    }),
    fetchLandscapeViewPending: state => ({
      ...state,
      view: initialState.view
    }),
    fetchLandscapeViewRejected: (state, action) => ({
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
    fetchLandscapeViewFulfilled: (state, action) => ({
      ...state,
      view: {
        fetching: false,
        message: null,
        landscape: action.payload
      }
    })
  },
  extraReducers: {
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
  setFormNewValues,
  fetchLandscapesPending,
  fetchLandscapesRejected,
  fetchLandscapesFulfilled,
  fetchLandscapeViewPending,
  fetchLandscapeViewRejected,
  fetchLandscapeViewFulfilled
} = landscapeSlice.actions

export default landscapeSlice.reducer

const getMemberships = landscapes => {
  const groups = landscapes
    .map(landscape => landscape.defaultGroup)
    .filter(group => group.slug)
  return groupUtils.getMemberships(groups)
}

export const fetchLandscapes = () => dispatch => {
  dispatch(fetchLandscapesPending())
  landscapeService.fetchLandscapes()
    .then(landscapes => {
      dispatch(fetchLandscapesFulfilled(landscapes))
      dispatch(setMemberships(getMemberships(landscapes)))
    })
    .catch(error => {
      dispatch(fetchLandscapesRejected(error))
    })
}

export const fetchLandscapeView = slug => dispatch => {
  dispatch(fetchLandscapeViewPending())
  landscapeService.fetchLandscapeToView(slug)
    .then(landscape => {
      dispatch(fetchLandscapeViewFulfilled(landscape))
      dispatch(setMemberships(getMemberships([landscape])))
    })
    .catch(error => {
      dispatch(fetchLandscapeViewRejected(error))
    })
}
