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
import { User } from 'terrasoApi/account/accountSlice';
import * as groupService from 'terrasoApi/shared/group/groupService';
import * as groupUtils from 'terrasoApi/shared/group/groupUtils';
import {
  Message,
  createAsyncThunk,
  withExtra as withExtraInput,
} from 'terrasoApi/utils';

export type Group = {
  // TODO: massage groupUtils/Service so more of these can be required
  membersInfo?: {
    totalCount?: number;
    pendingCount?: number;
    accountMembership?: Membership;
    membersSample?: (Membership & Omit<User, 'preferences'>)[];
  };
  slug: string;
  id: string;
  email: string;
  name: string;
  description: string;
  website: string;
  membershipType: 'CLOSED' | 'OPEN';
};

export type Membership = {
  membershipId: string;
  userRole: 'MANAGER' | 'MEMBER';
  membershipStatus: 'APPROVED' | 'PENDING';
};

type MembershipGroup = {
  fetching?: boolean;
  joining?: boolean;
  message?: Message;
  group?: Group;
};

type GroupSliceState = typeof initialState;

const initialState = {
  memberships: {} as Record<string, MembershipGroup>,
  list: {
    fetching: true,
    groups: [] as Group[],
    message: null as Message | null,
  },
  autocomplete: {
    fetching: true,
    groups: [] as { slug: string; name: string }[],
  },
  view: {
    group: null as Group | null,
    fetching: true,
    refreshing: false,
    message: null as Message | null,
  },
  form: {
    group: null as Omit<Group, 'membersInfo'> | null,
    fetching: true,
    message: null as Message | null,
    success: false,
  },
  membersGroup: {
    data: null as Omit<Group, 'membersInfo'> | null,
    fetching: true,
  },
  members: {
    list: null as Record<string, Membership> | null,
    fetching: true,
  },
  sharedDataUpload: {
    group: null as Omit<
      Group,
      'email' | 'description' | 'website' | 'membershipType'
    > | null,
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
  withExtraInput<{ ownerName: string; successMessage: string }>()(
    groupService.joinGroup
  ),
  (group, { ownerName, successMessage }) => ({
    severity: 'success',
    content: successMessage,
    params: { name: ownerName },
  })
);
export const leaveGroup = createAsyncThunk(
  'group/leaveGroup',
  withExtraInput<{
    ownerName: string;
    successMessage: string;
    groupSlug: string;
  }>()(groupService.leaveGroup),
  (group, { ownerName, successMessage }) => ({
    severity: 'success',
    content: successMessage,
    params: { name: ownerName },
  })
);

const updateView = (
  state: GroupSliceState,
  action: ReturnType<typeof fetchGroupView.fulfilled>
): GroupSliceState => ({
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
    setMemberships: (
      state,
      action: { payload: Record<string, MembershipGroup> }
    ) => ({
      ...state,
      memberships: {
        ...state.memberships,
        ...Object.fromEntries(
          Object.entries(action.payload).map(
            ([groupSlug, newMembershipState]) => [
              groupSlug,
              {
                ...state.memberships[groupSlug],
                ...newMembershipState,
              },
            ]
          )
        ),
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

    builder.addCase(
      fetchMembers.pending,
      _.set('members', initialState.members)
    );

    builder.addCase(fetchMembers.fulfilled, (state, action) => ({
      ...state,
      members: {
        fetching: false,
        list: groupUtils.generateIndexedMembers(action.payload.members),
      },
    }));

    builder.addCase(fetchMembers.rejected, _.set('members.fetching', false));

    builder.addCase(removeMember.pending, (state, action) =>
      _.set(
        `members.list.${action.meta.arg.membershipId}.fetching`,
        true,
        state
      )
    );

    builder.addCase(removeMember.fulfilled, (state, action) => ({
      ...state,
      members: {
        fetching: false,
        list: groupUtils.generateIndexedMembers(action.payload.members),
      },
    }));

    builder.addCase(removeMember.rejected, (state, action) =>
      _.set(
        `members.list.${action.meta.arg.membershipId}.fetching`,
        false,
        state
      )
    );

    builder.addCase(updateMember.pending, (state, action) =>
      _.set(
        `members.list.${action.meta.arg.member.membershipId}.fetching`,
        true,
        state
      )
    );

    builder.addCase(updateMember.fulfilled, (state, action) => ({
      ...state,
      members: {
        fetching: false,
        list: groupUtils.generateIndexedMembers(action.payload.members),
      },
    }));

    builder.addCase(updateMember.rejected, (state, action) =>
      _.set(
        `members.list.${action.meta.arg.member.membershipId}.fetching`,
        false,
        state
      )
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
