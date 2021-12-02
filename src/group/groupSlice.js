import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'

import * as groupService from 'group/groupService'

const initialState = {
  form: {
    group: null,
    fetching: true,
    message: null
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
        message: null,
        group: action.payload
      }
    }),
    [fetchGroup.rejected]: (state, action) => ({
      ...state,
      form: {
        ...state.form,
        fetching: false,
        message: {
          severity: 'error',
          content: action.error.message
        }
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
        group: action.payload,
        message: {
          severity: 'success',
          content: 'group.form_message_success'
        }
      }
    }),
    [saveGroup.rejected]: (state, action) => ({
      ...state,
      form: {
        ...state.form,
        fetching: false,
        message: {
          severity: 'error',
          content: action.error.message
        }
      }
    })
  }
})

export const {
  setFormNewValues
} = groupSlice.actions

export default groupSlice.reducer
