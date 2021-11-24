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
  reducers: {},
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
        group: action.payload.group
      }
    }),
    [fetchGroup.rejected]: (state, action) => ({
      ...state,
      form: {
        fetching: false,
        error: action.payload
      }
    }),
    [saveGroup.pending]: state => ({
      ...state,
      form: initialState.form
    }),
    [saveGroup.fulfilled]: (state, action) => ({
      ...state,
      form: {
        fetching: false,
        error: null,
        group: action.payload.group
      }
    }),
    [saveGroup.rejected]: (state, action) => ({
      ...state,
      form: {
        fetching: false,
        error: action.payload
      }
    })
  }
})

export default groupSlice.reducer
