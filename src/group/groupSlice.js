/*
 * Copyright © 2021-2023 Technology Matters
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see https://www.gnu.org/licenses/.
 */
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
  autocomplete: {
    fetching: true,
    groups: [],
  },
  view: {
    group: null,
    fetching: true,
    refreshing: false,
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
export const fetchGroupsAutocompleteList = createAsyncThunk(
  'group/fetchGroupsAutocompleteList',
  groupService.fetchGroupsAutocompleteList
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
export const updateMember = createAsyncThunk(
  'group/updateMember',
  groupService.updateMember
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
  (group, { ownerName, successMessage }) => ({
    severity: 'success',
    content: successMessage,
    params: { name: ownerName },
  })
);
export const leaveGroup = createAsyncThunk(
  'group/leaveGroup',
  groupService.leaveGroup,
  (group, { ownerName, successMessage }) => ({
    severity: 'success',
    content: successMessage,
    params: { name: ownerName },
  })
);

const updateView = (state, action) => ({
  ...groupSlice.caseReducers.setMemberships(state, {
    payload: groupUtils.getMemberships([action.payload]),
  }),
  view: {
    fetching: false,
    refreshing: false,
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

  extraReducers: builder => {
    builder.addCase(fetchGroupView.pending, state => ({
      ...state,
      view: initialState.view,
    }));

    builder.addCase(fetchGroupView.fulfilled, updateView);

    builder.addCase(fetchGroupView.rejected, (state, action) => ({
      ...state,
      view: {
        ...state.form,
        fetching: false,
        message: {
          severity: 'error',
          content: action.payload,
        },
      },
    }));

    builder.addCase(refreshGroupView.pending, _.set('view.refreshing', true));

    builder.addCase(refreshGroupView.fulfilled, updateView);

    builder.addCase(refreshGroupView.rejected, _.set('view.refreshing', false));

    builder.addCase(fetchGroups.pending, state => ({
      ...state,
      list: initialState.list,
    }));

    builder.addCase(fetchGroups.rejected, (state, action) => ({
      ...state,
      list: {
        ...state.list,
        fetching: false,
        message: {
          severity: 'error',
          content: action.payload,
        },
      },
    }));

    builder.addCase(fetchGroups.fulfilled, (state, action) => ({
      ...groupSlice.caseReducers.setMemberships(state, {
        payload: groupUtils.getMemberships(action.payload),
      }),
      list: {
        fetching: false,
        message: null,
        groups: action.payload,
      },
    }));

    builder.addCase(fetchGroupsAutocompleteList.pending, state => ({
      ...state,
      autocomplete: initialState.autocomplete,
    }));

    builder.addCase(fetchGroupsAutocompleteList.rejected, (state, action) => ({
      ...state,
      autocomplete: {
        ...state.autocomplete,
        fetching: false,
      },
    }));

    builder.addCase(fetchGroupsAutocompleteList.fulfilled, (state, action) => ({
      autocomplete: {
        fetching: false,
        groups: action.payload,
      },
    }));

    builder.addCase(fetchGroupForm.pending, state => ({
      ...state,
      form: initialState.form,
    }));

    builder.addCase(fetchGroupForm.fulfilled, (state, action) => ({
      ...state,
      form: {
        fetching: false,
        message: null,
        group: action.payload,
      },
    }));

    builder.addCase(fetchGroupForm.rejected, (state, action) => ({
      ...state,
      form: {
        ...state.form,
        fetching: false,
        message: {
          severity: 'error',
          content: action.payload,
        },
      },
    }));

    builder.addCase(
      fetchGroupForMembers.pending,
      _.set('membersGroup', initialState.membersGroup)
    );

    builder.addCase(fetchGroupForMembers.fulfilled, (state, action) =>
      _.set(
        'membersGroup',
        {
          fetching: false,
          data: action.payload,
        },
        state
      )
    );

    builder.addCase(
      fetchGroupForMembers.rejected,
      _.set('membersGroup', initialState.membersGroup)
    );

    builder.addCase(
      fetchMembers.pending,
      _.set('members', initialState.members)
    );

    builder.addCase(fetchMembers.fulfilled, (state, action) =>
      _.set(
        'members',
        {
          fetching: false,
          list: groupUtils.generateIndexedMembers(action.payload.members),
        },
        state
      )
    );

    builder.addCase(fetchMembers.rejected, _.set('members.fetching', false));

    builder.addCase(removeMember.pending, (state, action) =>
      _.set(`members.list.${action.meta.arg.id}.fetching`, true, state)
    );

    builder.addCase(removeMember.fulfilled, (state, action) =>
      _.set(
        'members',
        {
          fetching: false,
          list: groupUtils.generateIndexedMembers(action.payload.members),
        },
        state
      )
    );

    builder.addCase(removeMember.rejected, (state, action) =>
      _.set(`members.list.${action.meta.arg.id}.fetching`, false, state)
    );

    builder.addCase(updateMember.pending, (state, action) =>
      _.set(`members.list.${action.meta.arg.member.id}.fetching`, true, state)
    );

    builder.addCase(updateMember.fulfilled, (state, action) =>
      _.set(
        'members',
        {
          fetching: false,
          list: groupUtils.generateIndexedMembers(action.payload.members),
        },
        state
      )
    );

    builder.addCase(updateMember.rejected, (state, action) =>
      _.set(`members.list.${action.meta.arg.member.id}.fetching`, false, state)
    );

    builder.addCase(saveGroup.pending, state => ({
      ...state,
      form: {
        ...state.form,
        fetching: true,
      },
    }));

    builder.addCase(saveGroup.fulfilled, (state, action) => ({
      ...state,
      form: {
        ...state.form,
        fetching: false,
        success: true,
        group: action.payload,
      },
    }));

    builder.addCase(saveGroup.rejected, (state, action) => ({
      ...state,
      form: {
        ...state.form,
        fetching: false,
      },
    }));

    builder.addCase(joinGroup.pending, (state, action) =>
      groupSlice.caseReducers.setMemberships(state, {
        payload: {
          [action.meta.arg.groupSlug]: {
            joining: true,
          },
        },
      })
    );

    builder.addCase(joinGroup.fulfilled, (state, action) =>
      groupSlice.caseReducers.setMemberships(state, {
        payload: {
          [action.meta.arg.groupSlug]: {
            joining: false,
            group: action.payload,
          },
        },
      })
    );

    builder.addCase(joinGroup.rejected, (state, action) =>
      groupSlice.caseReducers.setMemberships(state, {
        payload: {
          [action.meta.arg.groupSlug]: {
            joining: false,
          },
        },
      })
    );

    builder.addCase(leaveGroup.pending, (state, action) =>
      groupSlice.caseReducers.setMemberships(state, {
        payload: {
          [action.meta.arg.groupSlug]: {
            joining: true,
            message: null,
          },
        },
      })
    );

    builder.addCase(leaveGroup.fulfilled, (state, action) =>
      groupSlice.caseReducers.setMemberships(state, {
        payload: {
          [action.payload.slug]: {
            joining: false,
            group: action.payload,
          },
        },
      })
    );

    builder.addCase(leaveGroup.rejected, (state, action) =>
      groupSlice.caseReducers.setMemberships(state, {
        payload: {
          [action.meta.arg.groupSlug]: {
            joining: false,
          },
        },
      })
    );

    builder.addCase(fetchGroupUpload.pending, state => ({
      ...state,
      sharedDataUpload: initialState.sharedDataUpload,
    }));

    builder.addCase(fetchGroupUpload.fulfilled, (state, action) => ({
      ...state,
      sharedDataUpload: {
        ...state.sharedDataUpload,
        fetching: false,
        group: action.payload,
      },
    }));

    builder.addCase(fetchGroupUpload.rejected, (state, action) => ({
      ...state,
      sharedDataUpload: {
        ...state.sharedDataUpload,
        fetching: false,
      },
    }));
  },
});

export const { setFormNewValues, setMemberships, resetFormSuccess } =
  groupSlice.actions;

export default groupSlice.reducer;
