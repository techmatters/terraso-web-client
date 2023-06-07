/*
 * Copyright © 2023 Technology Matters
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
import * as membershipsService from 'terrasoApi/shared/memberships/membershipsService';
import * as membershipsUtils from 'terrasoApi/shared/memberships/membershipsUtils';
import {
  createAsyncThunk,
  Message,
  withExtra as withExtraInput,
} from 'terrasoApi/shared/store/utils';

export type MembershipList = {
  // TODO: massage membershipsUtils/Service so more of these can be required
  membersInfo?: {
    totalCount?: number;
    pendingCount?: number;
    accountMembership?: Membership;
    membersSample?: Membership[];
  };
  id: string;
  slug: string;
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
  group?: MembershipList;
};

const initialState = {
  memberships: {} as Record<string, MembershipGroup | undefined>,
  members: {
    list: null as Record<string, Membership | undefined> | null,
    fetching: true,
  },
};

export const fetchMembers = createAsyncThunk(
  'memberships/fetchMembers',
  membershipsService.fetchMembers
);
export const removeMember = createAsyncThunk(
  'memberships/removeMember',
  membershipsService.removeMember
);
export const updateMember = createAsyncThunk(
  'memberships/updateMember',
  membershipsService.updateMember
);
export const joinMembershipList = createAsyncThunk(
  'memberships/joinMembershipList',
  withExtraInput<{ ownerName: string; successMessage: string }>()(
    membershipsService.joinMembershipList
  ),
  (group, { ownerName, successMessage }) => ({
    severity: 'success',
    content: successMessage,
    params: { name: ownerName },
  })
);
export const leaveMembershipList = createAsyncThunk(
  'memberships/leaveGroup',
  withExtraInput<{
    ownerName: string;
    successMessage: string;
    groupSlug: string;
  }>()(membershipsService.leaveMembershipList),
  (group, { ownerName, successMessage }) => ({
    severity: 'success',
    content: successMessage,
    params: { name: ownerName },
  })
);

export const membershipsSlice = createSlice({
  name: 'memberships',
  initialState,

  reducers: {
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
  },

  extraReducers: builder => {
    builder.addCase(
      fetchMembers.pending,
      _.set('members', initialState.members)
    );

    builder.addCase(fetchMembers.fulfilled, (state, action) => ({
      ...state,
      members: {
        fetching: false,
        list: membershipsUtils.generateIndexedMembers(action.payload.members),
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
        list: membershipsUtils.generateIndexedMembers(action.payload.members),
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
        list: membershipsUtils.generateIndexedMembers(action.payload.members),
      },
    }));

    builder.addCase(updateMember.rejected, (state, action) =>
      _.set(
        `members.list.${action.meta.arg.member.membershipId}.fetching`,
        false,
        state
      )
    );

    builder.addCase(joinMembershipList.pending, (state, action) =>
      membershipsSlice.caseReducers.setMemberships(state, {
        payload: {
          [action.meta.arg.groupSlug]: {
            joining: true,
          },
        },
      })
    );

    builder.addCase(joinMembershipList.fulfilled, (state, action) =>
      membershipsSlice.caseReducers.setMemberships(state, {
        payload: {
          [action.meta.arg.groupSlug]: {
            joining: false,
            group: action.payload,
          },
        },
      })
    );

    builder.addCase(joinMembershipList.rejected, (state, action) =>
      membershipsSlice.caseReducers.setMemberships(state, {
        payload: {
          [action.meta.arg.groupSlug]: {
            joining: false,
          },
        },
      })
    );

    builder.addCase(leaveMembershipList.pending, (state, action) =>
      membershipsSlice.caseReducers.setMemberships(state, {
        payload: {
          [action.meta.arg.groupSlug]: {
            joining: true,
          },
        },
      })
    );

    builder.addCase(leaveMembershipList.fulfilled, (state, action) =>
      membershipsSlice.caseReducers.setMemberships(state, {
        payload: {
          [action.payload.slug]: {
            joining: false,
            group: action.payload,
          },
        },
      })
    );

    builder.addCase(leaveMembershipList.rejected, (state, action) =>
      membershipsSlice.caseReducers.setMemberships(state, {
        payload: {
          [action.meta.arg.groupSlug]: {
            joining: false,
          },
        },
      })
    );
  },
});

export const { setMemberships } = membershipsSlice.actions;

export default membershipsSlice.reducer;
