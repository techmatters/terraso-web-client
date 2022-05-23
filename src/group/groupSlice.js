import { createSlice } from '@reduxjs/toolkit';
import _ from 'lodash/fp';

import { createAsyncThunk } from 'state/utils';

import * as groupService from 'group/groupService';
import * as groupUtils from 'group/groupUtils';

const initialState = {
  memberships: {},
  list: {
    fetching: true,
    groups: [],
    message: null,
  },
  view: {
    group: null,
    fetching: true,
    message: null,
  },
  form: {
    group: null,
    fetching: true,
    message: null,
    success: false,
  },
  membersGroup: {
    data: null,
    fetching: true,
  },
  members: {
    list: null,
    fetching: true,
  },
  sharedDataUpload: {
    group: null,
    fetching: true,
  },
};

export const fetchGroupForm = createAsyncThunk(
  'group/fetchGroupForm',
  groupService.fetchGroupToUpdate
);
export const fetchGroupView = createAsyncThunk(
  'group/fetchGroupView',
  groupService.fetchGroupToView
);
export const refreshGroupView = createAsyncThunk(
  'group/refreshGroupView',
  groupService.fetchGroupToView
);
export const fetchGroupUpload = createAsyncThunk(
  'group/fetchGroupUpload',
  groupService.fetchGroupToUploadSharedData
);
export const fetchGroups = createAsyncThunk(
  'group/fetchGroups',
  groupService.fetchGroups
);
export const fetchGroupForMembers = createAsyncThunk(
  'group/fetchGroupForMembers',
  groupService.fetchGroupForMembers
);
export const fetchMembers = createAsyncThunk(
  'group/fetchMembers',
  groupService.fetchMembers
);
export const removeMember = createAsyncThunk(
  'group/removeMember',
  groupService.removeMember
);
export const updateMemberRole = createAsyncThunk(
  'group/updateMemberRole',
  groupService.updateMemberRole
);
export const saveGroup = createAsyncThunk(
  'group/saveGroup',
  groupService.saveGroup,
  group => ({
    severity: 'success',
    content: group.new ? 'group.added' : 'group.updated',
    params: { name: group.name },
  })
);
export const joinGroup = createAsyncThunk(
  'group/joinGroup',
  groupService.joinGroup,
  (group, { ownerName }) => ({
    severity: 'success',
    content: 'group.join_success',
    params: { name: ownerName },
  })
);
export const leaveGroup = createAsyncThunk(
  'group/leaveGroup',
  groupService.leaveGroup,
  (group, { ownerName }) => ({
    severity: 'success',
    content: 'group.leave_success',
    params: { name: ownerName },
  })
);

const updateView = (state, action) => ({
  ...groupSlice.caseReducers.setMemberships(state, {
    payload: groupUtils.getMemberships([action.payload]),
  }),
  view: {
    fetching: false,
    message: null,
    group: action.payload,
  },
});

const groupSlice = createSlice({
  name: 'group',
  initialState,
  reducers: {
    setFormNewValues: state => ({
      ...state,
      form: {
        ...state.form,
        group: null,
        fetching: false,
      },
    }),
    setMemberships: (state, action) => ({
      ...state,
      memberships: {
        ...state.memberships,
        ..._.flow(
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
          _.toPairs,
          _.map(([groupSlug, newMembershipState]) => [
            groupSlug,
            {
              ..._.getOr({}, `memberships.${groupSlug}`, state),
              ...newMembershipState,
            },
          ]),
          _.fromPairs
        )(action.payload),
      },
    }),
    resetFormSuccess: state => ({
      ...state,
      form: {
        ...state.form,
        success: false,
      },
    }),
  },
  extraReducers: {
    [fetchGroupView.pending]: state => ({
      ...state,
      view: initialState.view,
    }),
    [fetchGroupView.fulfilled]: updateView,
    [refreshGroupView.fulfilled]: updateView,
    [fetchGroupView.rejected]: (state, action) => ({
      ...state,
      view: {
        ...state.form,
        fetching: false,
        message: {
          severity: 'error',
          content: action.payload,
        },
      },
    }),
    [fetchGroups.pending]: state => ({
      ...state,
      list: initialState.list,
    }),
    [fetchGroups.rejected]: (state, action) => ({
      ...state,
      list: {
        ...state.list,
        fetching: false,
        message: {
          severity: 'error',
          content: action.payload,
        },
      },
    }),
    [fetchGroups.fulfilled]: (state, action) => ({
      ...groupSlice.caseReducers.setMemberships(state, {
        payload: groupUtils.getMemberships(action.payload),
      }),
      list: {
        fetching: false,
        message: null,
        groups: action.payload,
      },
    }),
    [fetchGroupForm.pending]: state => ({
      ...state,
      form: initialState.form,
    }),
    [fetchGroupForm.fulfilled]: (state, action) => ({
      ...state,
      form: {
        fetching: false,
        message: null,
        group: action.payload,
      },
    }),
    [fetchGroupForm.rejected]: (state, action) => ({
      ...state,
      form: {
        ...state.form,
        fetching: false,
        message: {
          severity: 'error',
          content: action.payload,
        },
      },
    }),
    [fetchGroupForMembers.pending]: state =>
      _.set('membersGroup', initialState.membersGroup, state),
    [fetchGroupForMembers.fulfilled]: (state, action) =>
      _.set(
        'membersGroup',
        {
          fetching: false,
          data: action.payload,
        },
        state
      ),
    [fetchGroupForMembers.rejected]: state =>
      _.set('membersGroup', initialState.membersGroup, state),
    [fetchMembers.pending]: state =>
      _.set('members', initialState.members, state),
    [fetchMembers.fulfilled]: (state, action) =>
      _.set(
        'members',
        {
          fetching: false,
          list: groupUtils.generateIndexedMembers(action.payload.members),
        },
        state
      ),
    [fetchMembers.rejected]: state => _.set('members.fetching', false, state),
    [removeMember.pending]: (state, action) =>
      _.set(`members.list.${action.meta.arg.id}.fetching`, true, state),
    [removeMember.fulfilled]: (state, action) =>
      _.set(
        'members',
        {
          fetching: false,
          list: groupUtils.generateIndexedMembers(action.payload.members),
        },
        state
      ),
    [removeMember.rejected]: (state, action) =>
      _.set(`members.list.${action.meta.arg.id}.fetching`, false, state),
    [updateMemberRole.pending]: (state, action) =>
      _.set(`members.list.${action.meta.arg.member.id}.fetching`, true, state),
    [updateMemberRole.fulfilled]: (state, action) =>
      _.set(
        'members',
        {
          fetching: false,
          list: groupUtils.generateIndexedMembers(action.payload.members),
        },
        state
      ),
    [updateMemberRole.rejected]: (state, action) =>
      _.set(`members.list.${action.meta.arg.member.id}.fetching`, false, state),
    [saveGroup.pending]: state => ({
      ...state,
      form: {
        ...state.form,
        fetching: true,
      },
    }),
    [saveGroup.fulfilled]: (state, action) => ({
      ...state,
      form: {
        ...state.form,
        fetching: false,
        success: true,
        group: action.payload,
      },
    }),
    [saveGroup.rejected]: (state, action) => ({
      ...state,
      form: {
        ...state.form,
        fetching: false,
      },
    }),
    [joinGroup.pending]: (state, action) =>
      groupSlice.caseReducers.setMemberships(state, {
        payload: {
          [action.meta.arg.groupSlug]: {
            joining: true,
          },
        },
      }),
    [joinGroup.fulfilled]: (state, action) =>
      groupSlice.caseReducers.setMemberships(state, {
        payload: {
          [action.meta.arg.groupSlug]: {
            joining: false,
            group: action.payload,
          },
        },
      }),
    [joinGroup.rejected]: (state, action) =>
      groupSlice.caseReducers.setMemberships(state, {
        payload: {
          [action.meta.arg.groupSlug]: {
            joining: false,
          },
        },
      }),
    [leaveGroup.pending]: (state, action) =>
      groupSlice.caseReducers.setMemberships(state, {
        payload: {
          [action.meta.arg.groupSlug]: {
            joining: true,
            message: null,
          },
        },
      }),
    [leaveGroup.fulfilled]: (state, action) =>
      groupSlice.caseReducers.setMemberships(state, {
        payload: {
          [action.payload.slug]: {
            joining: false,
            group: action.payload,
          },
        },
      }),
    [leaveGroup.rejected]: (state, action) =>
      groupSlice.caseReducers.setMemberships(state, {
        payload: {
          [action.meta.arg.groupSlug]: {
            joining: false,
          },
        },
      }),
    [fetchGroupUpload.pending]: state => ({
      ...state,
      sharedDataUpload: initialState.sharedDataUpload,
    }),
    [fetchGroupUpload.fulfilled]: (state, action) => ({
      ...state,
      sharedDataUpload: {
        ...state.sharedDataUpload,
        fetching: false,
        group: action.payload,
      },
    }),
    [fetchGroupUpload.rejected]: (state, action) => ({
      ...state,
      sharedDataUpload: {
        ...state.sharedDataUpload,
        fetching: false,
      },
    }),
  },
});

export const { setFormNewValues, setMemberships, resetFormSuccess } =
  groupSlice.actions;

export default groupSlice.reducer;
