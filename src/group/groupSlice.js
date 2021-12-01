import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'

import * as groupService from 'group/groupService'

const initialState = {
  form: {
    group: null,
    fetching: true,
    error: null
  }
}

export const fetchGroup = createAsyncThunk('group/fetchGroup', groupService.fetchGroup)
export const saveGroup = createAsyncThunk('group/saveGroup', groupService.saveGroup)

const groupSlice = createSlice({
  name: 'group',
  initialState,
  reducers: {
    setFormNewValues: state => ({
      ...state,
      form: {
        ...state.form,
        group: null,
        fetching: false
      }
    })
  },
  extraReducers: {
    [fetchGroup.pending]: state => ({
      ...state,
      form: initialState.form
    }),
    [fetchGroup.fulfilled]: (state, action) => ({
      ...state,
      form: {
        fetching: false,
        error: null,
        group: action.payload
      }
    }),
    [fetchGroup.rejected]: (state, action) => ({
      ...state,
      form: {
        ...state.form,
        fetching: false,
        error: action.error.message
      }
    }),
    [saveGroup.pending]: state => ({
      ...state,
      form: {
        ...state.form,
        fetching: true
      }
    }),
    [saveGroup.fulfilled]: (state, action) => ({
      ...state,
      form: {
        ...state.form,
        fetching: false,
        error: null,
        group: action.payload
      }
    }),
    [saveGroup.rejected]: (state, action) => ({
      ...state,
      form: {
        ...state.form,
        fetching: false,
        error: action.error.message
      }
    })
  }
})

export const {
  setFormNewValues
} = groupSlice.actions

export default groupSlice.reducer
