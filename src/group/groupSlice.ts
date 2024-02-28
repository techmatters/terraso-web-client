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
  Membership,
  MembershipList,
} from 'terraso-client-shared/collaboration/membershipsUtils';
import type { MembershipsInfo } from 'terraso-client-shared/collaboration/membershipsUtils';
import type { Message } from 'terraso-client-shared/notifications/notificationsSlice';
import { createAsyncThunk } from 'terraso-client-shared/store/utils';

import * as groupService from 'group/groupService';
import { setSharedResourcesList } from 'sharedData/sharedDataSlice';

export type Group = {
  slug: string;
  id: string;
  email: string;
  name: string;
  description: string;
  website: string;
  membershipInfo?: MembershipsInfo;
};

export const fetchGroupForm = createAsyncThunk(
  'group/fetchGroupForm',
  groupService.fetchGroupToUpdate
);

export const fetchGroupView = createAsyncThunk(
  'group/fetchGroupView',
  async (slug: string, user, { dispatch }) => {
    const group = await groupService.fetchGroupToView(slug, user);
    dispatch(setSharedResourcesList(group.sharedResources));
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
export const leaveGroup = createAsyncThunk(
  'group/leaveGroup',
  groupService.leaveGroup
);
export const joinGroup = createAsyncThunk(
  'group/joinGroup',
  groupService.joinGroup
);
export const leaveGroupFromList = createAsyncThunk(
  'group/leaveGroupFromList',
  groupService.leaveGroupFromList
);
export const joinGroupFromListPage = createAsyncThunk(
  'group/joinGroupFromListPage',
  groupService.joinGroupFromListPage
);
export const changeMemberRole = createAsyncThunk(
  'group/changeMemberRole',
  groupService.changeMemberRole
);
export const removeMember = createAsyncThunk(
  'group/removeMember',
  groupService.removeMember
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
  members: {
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
  action:
    | ReturnType<typeof fetchGroupView.fulfilled>
    | ReturnType<typeof joinGroup.fulfilled>
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
      _.set('members', initialState.members)
    );

    builder.addCase(fetchGroupForMembers.fulfilled, (state, action) => ({
      ...state,
      members: {
        fetching: false,
        data: action.payload,
      },
    }));

    builder.addCase(
      fetchGroupForMembers.rejected,
      _.set('members', initialState.members)
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

    builder.addCase(leaveGroup.pending, (state, action) =>
      _.set(
        `view.group.membershipsInfo.accountMembership.fetching`,
        true,
        state
      )
    );
    builder.addCase(leaveGroup.fulfilled, updateView);
    builder.addCase(leaveGroup.rejected, (state, action) =>
      _.set(
        `view.group.membershipsInfo.accountMembership.fetching`,
        false,
        state
      )
    );

    builder.addCase(joinGroup.pending, (state, action) =>
      _.set(
        `view.group.membershipsInfo.accountMembership.fetching`,
        true,
        state
      )
    );
    builder.addCase(joinGroup.fulfilled, updateView);
    builder.addCase(joinGroup.rejected, (state, action) =>
      _.set(
        `view.group.membershipsInfo.accountMembership.fetching`,
        false,
        state
      )
    );

    builder.addCase(leaveGroupFromList.pending, (state, action) => {
      return updateGroupListItem(
        state,
        action.meta.arg.groupSlug,
        _.set('accountMembership.fetching', true)
      );
    });
    builder.addCase(leaveGroupFromList.fulfilled, (state, action) => {
      return updateGroupListItem(
        state,
        action.meta.arg.groupSlug,
        () => action.payload
      );
    });
    builder.addCase(leaveGroupFromList.rejected, (state, action) => {
      return updateGroupListItem(
        state,
        action.meta.arg.groupSlug,
        _.set('accountMembership.fetching', false)
      );
    });

    builder.addCase(joinGroupFromListPage.pending, (state, action) => {
      return updateGroupListItem(
        state,
        action.meta.arg.groupSlug,
        _.set('accountMembership.fetching', true)
      );
    });
    builder.addCase(joinGroupFromListPage.fulfilled, (state, action) => {
      return updateGroupListItem(
        state,
        action.meta.arg.groupSlug,
        () => action.payload
      );
    });
    builder.addCase(joinGroupFromListPage.rejected, (state, action) => {
      return updateGroupListItem(
        state,
        action.meta.arg.groupSlug,
        _.set('accountMembership.fetching', false)
      );
    });

    builder.addCase(changeMemberRole.pending, (state, action) => {
      return updateMemberItem(
        state,
        action.meta.arg.userEmails as Array<string>,
        _.set('fetching', true)
      );
    });
    builder.addCase(changeMemberRole.fulfilled, (state, action) => {
      return updateMemberItem(
        state,
        action.meta.arg.userEmails as Array<string>,
        () => action.payload as Membership
      );
    });
    builder.addCase(changeMemberRole.rejected, (state, action) => {
      return updateMemberItem(
        state,
        action.meta.arg.userEmails as Array<string>,
        _.set('fetching', false)
      );
    });

    builder.addCase(removeMember.pending, (state, action) => {
      return updateMemberItem(
        state,
        [action.meta.arg.email],
        _.set('fetching', true)
      );
    });
    builder.addCase(removeMember.fulfilled, (state, action) => {
      return updateMemberItem(state, [action.meta.arg.email], () => null);
    });
    builder.addCase(removeMember.rejected, (state, action) => {
      return updateMemberItem(
        state,
        [action.meta.arg.email],
        _.set('fetching', false)
      );
    });
  },
});

export const { setFormNewValues, resetFormSuccess } = groupSlice.actions;

export default groupSlice.reducer;

const updateGroupListItem = (
  state: GroupSliceState,
  slug: string,
  valueGenerator: (group: Group) => Group
) => {
  return {
    ...state,
    list: {
      ...state.list,
      groups: state.list.groups.map(group =>
        group.slug === slug ? valueGenerator(group) : group
      ),
    },
  };
};

const updateMemberItem = (
  state: GroupSliceState,
  userEmails: Array<string>,
  valueGenerator: (membership: Membership) => Membership | null
) => {
  return _.set(
    'members.data.membershipsInfo.membershipsSample',
    state.members.data?.membershipsInfo?.membershipsSample
      ?.map((membership: Membership) =>
        _.includes(membership.user?.email, userEmails)
          ? valueGenerator(membership)
          : membership
      )
      .filter(membership => membership),
    state
  );
};
