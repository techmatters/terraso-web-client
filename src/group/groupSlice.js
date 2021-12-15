import _ from 'lodash'
import { createSlice } from '@reduxjs/toolkit'

import { createAsyncThunk } from 'state/utils'
import * as groupService from 'group/groupService'
import * as groupUtils from 'group/groupUtils'

const initialState = {
  memberships: {},
  list: {
    fetching: true,
    groups: [],
    message: null
  },
  view: {
    group: null,
    fetching: true,
    message: null
  },
  form: {
    group: null,
    fetching: true,
    message: null,
    success: false
  }
}

export const fetchGroupForm = createAsyncThunk('group/fetchGroupForm', groupService.fetchGroupToUpdate)
export const fetchGroupView = createAsyncThunk('group/fetchGroupView', groupService.fetchGroupToView)
export const fetchGroups = createAsyncThunk('group/fetchGroups', groupService.fetchGroups)
export const saveGroup = createAsyncThunk('group/saveGroup', groupService.saveGroup)
export const joinGroup = createAsyncThunk('group/joinGroup', groupService.joinGroup)
export const leaveGroup = createAsyncThunk('group/leaveGroup', groupService.leaveGroup)

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
    }),
    setMemberships: (state, action) => ({
      ...state,
      memberships: {
        ...state.memberships,
        ..._.chain(action.payload)
          //  Final output
          //  {
          //    'group-slug-1': {
          //      fetching: false,
          //      joining: false,
          //      message: {
          //        severity: 'error',
          //        content: 'Saved'
          //      },
          //      group: {
          //        slug: 'group-slug-1',
          //        members: [{
          //          email: 'email@email.com',
          //          firsName: 'John',
          //          lastName: 'Doe'
          //        },...]
          //      }
          //    },
          //    ...
          //  }
          .toPairs()
          .map(([groupSlug, newMembershipState]) => ([
            groupSlug,
            {
              ..._.get(state, `memberships.${groupSlug}`, {}),
              ...newMembershipState
            }
          ]))
          .fromPairs()
          .value()
      }
    }),
    resetFormSuccess: state => ({
      ...state,
      form: {
        ...state.form,
        success: false
      }
    })
  },
  extraReducers: {
    [fetchGroupView.pending]: state => ({
      ...state,
      view: initialState.view
    }),
    [fetchGroupView.fulfilled]: (state, action) => ({
      ...groupSlice.caseReducers.setMemberships(state, {
        payload: groupUtils.getMemberships([action.payload])
      }),
      view: {
        fetching: false,
        message: null,
        group: action.payload
      }
    }),
    [fetchGroupView.rejected]: (state, action) => ({
      ...state,
      view: {
        ...state.form,
        fetching: false,
        message: {
          severity: 'error',
          content: action.payload
        }
      }
    }),
    [fetchGroups.pending]: state => ({
      ...state,
      list: initialState.list
    }),
    [fetchGroups.rejected]: (state, action) => ({
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
    [fetchGroups.fulfilled]: (state, action) => ({
      ...groupSlice.caseReducers.setMemberships(state, {
        payload: groupUtils.getMemberships(action.payload)
      }),
      list: {
        fetching: false,
        message: null,
        groups: action.payload
      }
    }),
    [fetchGroupForm.pending]: state => ({
      ...state,
      form: initialState.form
    }),
    [fetchGroupForm.fulfilled]: (state, action) => ({
      ...state,
      form: {
        fetching: false,
        message: null,
        group: action.payload
      }
    }),
    [fetchGroupForm.rejected]: (state, action) => ({
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
        success: true,
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
    [joinGroup.pending]: (state, action) =>
      groupSlice.caseReducers.setMemberships(state, {
        payload: {
          [action.meta.arg.groupSlug]: {
            joining: true,
            message: null
          }
        }
      }),
    [joinGroup.fulfilled]: (state, action) =>
      groupSlice.caseReducers.setMemberships(state, {
        payload: {
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
    [joinGroup.rejected]: (state, action) =>
      groupSlice.caseReducers.setMemberships(state, {
        payload: {
          [action.meta.arg.groupSlug]: {
            joining: false,
            message: {
              severity: 'error',
              content: action.payload
            }
          }
        }
      }),
    [leaveGroup.pending]: (state, action) =>
      groupSlice.caseReducers.setMemberships(state, {
        payload: {
          [action.meta.arg.groupSlug]: {
            joining: true,
            message: null
          }
        }
      }),
    [leaveGroup.fulfilled]: (state, action) =>
      groupSlice.caseReducers.setMemberships(state, {
        payload: {
          [action.payload.groupSlug]: {
            joining: false,
            group: null,
            message: {
              severity: 'success',
              content: 'group.leave_success'
            }
          }
        }
      }),
    [leaveGroup.rejected]: (state, action) =>
      groupSlice.caseReducers.setMemberships(state, {
        payload: {
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
  setFormNewValues,
  setMemberships,
  resetFormSuccess
} = groupSlice.actions

export default groupSlice.reducer
