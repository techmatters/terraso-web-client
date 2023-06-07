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
import * as _ from 'lodash/fp';
import {
  MembershipList,
  setMemberships,
} from 'terrasoApi/shared/memberships/membershipsSlice';
import { getMemberships } from 'terrasoApi/shared/memberships/membershipsUtils';
import { Message, createAsyncThunk } from 'terrasoApi/shared/store/utils';

import * as groupService from 'group/groupService';

export type Group = {
  slug: string;
  id: string;
  email: string;
  name: string;
  description: string;
  website: string;
} & MembershipList;

export const fetchGroupForm = createAsyncThunk(
  'group/fetchGroupForm',
  groupService.fetchGroupToUpdate
);

export const fetchGroupView = createAsyncThunk(
  'group/fetchGroupView',
  async (slug: string, user, { dispatch }) => {
    const group = await groupService.fetchGroupToView(slug);
    dispatch(setMemberships(getMemberships([group])));
    return group;
  }
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
  async (arg, user, { dispatch }) => {
    const groups = await groupService.fetchGroups();
    dispatch(setMemberships(getMemberships(groups)));
    return groups;
  }
);

export const fetchGroupsAutocompleteList = createAsyncThunk(
  'group/fetchGroupsAutocompleteList',
  groupService.fetchGroupsAutocompleteList
);

export const fetchGroupForMembers = createAsyncThunk(
  'group/fetchGroupForMembers',
  groupService.fetchGroupForMembers
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

type GroupSliceState = typeof initialState;

const initialState = {
  view: {
    group: null as Group | null,
    fetching: true,
    refreshing: false,
    message: null as Message | null,
  },
  list: {
    fetching: true,
    groups: [] as Group[],
    message: null as Message | null,
  },
  autocomplete: {
    fetching: true,
    groups: [] as { slug: string; name: string }[],
  },
  membersGroup: {
    data: null as Omit<MembershipList, 'membersInfo'> | null,
    fetching: true,
  },
  sharedDataUpload: {
    group: null as Omit<
      Group,
      'email' | 'description' | 'website' | 'membershipType'
    > | null,
    fetching: true,
  },
  form: {
    group: null as Omit<Group, 'membersInfo'> | null,
    fetching: true,
    message: null as Message | null,
    success: false,
  },
};

const updateView = (
  state: GroupSliceState,
  action: ReturnType<typeof fetchGroupView.fulfilled>
): GroupSliceState => ({
  ...state,
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
        ...state.view,
        ...state.form,
        fetching: false,
        refreshing: false,
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
      ...state,
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
      ...state,
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
        success: false,
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

    builder.addCase(fetchGroupForMembers.fulfilled, (state, action) => ({
      ...state,
      membersGroup: {
        fetching: false,
        data: action.payload,
      },
    }));

    builder.addCase(
      fetchGroupForMembers.rejected,
      _.set('membersGroup', initialState.membersGroup)
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

export const { setFormNewValues, resetFormSuccess } = groupSlice.actions;

export default groupSlice.reducer;
