import { createSlice } from '@reduxjs/toolkit'

import { createAsyncThunk } from 'state/utils'
import * as groupService from 'group/groupService'

const initialState = {
  memberships: {},
  form: {
    group: null,
    fetching: true,
    message: null
  }
}

export const fetchGroup = createAsyncThunk('group/fetchGroup', groupService.fetchGroup)
export const saveGroup = createAsyncThunk('group/saveGroup', groupService.saveGroup)
export const fetchGroupMembership = createAsyncThunk('group/fetchGroupMembership', groupService.fetchGroupMembership)
export const joinGroup = createAsyncThunk('group/joinGroup', groupService.joinGroup)

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
          content: action.payload
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
          content: action.payload
        }
      }
    }),
    [fetchGroupMembership.pending]: (state, action) => ({
      ...state,
      memberships: {
        ...state.memberships,
        [action.meta.arg]: {
          fetching: true,
          message: null,
          group: action.payload
        }
      }
    }),
    [fetchGroupMembership.fulfilled]: (state, action) => ({
      ...state,
      memberships: {
        ...state.memberships,
        [action.meta.arg]: {
          fetching: false,
          group: action.payload
        }
      }
    }),
    [fetchGroupMembership.rejected]: (state, action) => ({
      ...state,
      memberships: {
        ...state.memberships,
        [action.meta.arg]: {
          fetching: false,
          group: null,
          message: {
            severity: 'error',
            content: action.payload
          }
        }
      }
    }),
    [joinGroup.pending]: (state, action) => ({
      ...state,
      memberships: {
        ...state.memberships,
        [action.meta.arg.groupSlug]: {
          joining: true,
          message: null
        }
      }
    }),
    [joinGroup.fulfilled]: (state, action) => ({
      ...state,
      memberships: {
        ...state.memberships,
        [action.meta.arg.groupSlug]: {
          joining: false,
          group: action.payload,
          message: {
            severity: 'success',
            content: 'group.join_success'
          }
        }
      }
    }),
    [joinGroup.rejected]: (state, action) => ({
      ...state,
      memberships: {
        ...state.memberships,
        [action.meta.arg.groupSlug]: {
          joining: false,
          message: {
            severity: 'error',
            content: action.payload
          }
        }
      }
    })
  }
})

export const {
  setFormNewValues
} = groupSlice.actions

export default groupSlice.reducer
