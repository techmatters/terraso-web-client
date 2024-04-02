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
import { createAsyncThunk } from 'terraso-client-shared/store/utils';

import * as landscapeService from 'landscape/landscapeService';
import { setSharedResourcesList } from 'sharedData/sharedDataSlice';

const initialState = {
  list: {
    fetching: true,
    landscapes: [],
  },
  profile: {
    fetching: true,
    message: null,
    landscape: null,
    deletingProfileImage: false,
  },
  view: {
    fetching: true,
    refreshing: false,
    message: null,
    landscape: null,
  },
  form: {
    fetching: true,
    saving: false,
    message: null,
    landscape: null,
    success: false,
  },
  members: {
    data: null,
    fetching: true,
  },
  sharedDataUpload: {
    landscape: null,
    fetching: true,
  },
  uploadProfileImage: {
    uploading: false,
  },
};

export const fetchLandscapes = createAsyncThunk(
  'landscape/fetchLandscapes',
  landscapeService.fetchLandscapes
);
export const fetchLandscapeProfile = createAsyncThunk(
  'landscape/fetchLandscapeProfile',
  landscapeService.fetchLandscapeProfile
);
export const fetchLandscapeView = createAsyncThunk(
  'landscape/fetchLandscapeView',
  async (params, currentUser, { dispatch }) => {
    const landscape = await landscapeService.fetchLandscapeToView(
      params,
      currentUser
    );
    dispatch(setSharedResourcesList(landscape.sharedResources));
    return landscape;
  }
);
export const refreshLandscapeView = createAsyncThunk(
  'landscape/refreshLandscapeView',
  landscapeService.fetchLandscapeToView
);
export const fetchLandscapeUpload = createAsyncThunk(
  'landscape/fetchLandscapeUpload',
  landscapeService.fetchLandscapeToUploadSharedData
);
export const fetchLandscapeForm = createAsyncThunk(
  'landscape/fetchLandscapeForm',
  landscapeService.fetchLandscapeToUpdate
);
export const fetchLandscapeForMembers = createAsyncThunk(
  'group/fetchLandscapeForMembers',
  landscapeService.fetchLandscapeForMembers
);
export const saveLandscape = createAsyncThunk(
  'landscape/saveLandscape',
  landscapeService.saveLandscape,
  (landscape, { successKey }) => ({
    severity: 'success',
    content: successKey,
    params: { name: landscape.name },
  })
);
export const uploadProfileImage = createAsyncThunk(
  'landscape/uploadProfileImage',
  landscapeService.uploadProfileImage,
  () => ({
    severity: 'success',
    content: 'landscape.form_profile_profile_image_success',
  })
);
export const deleteProfileImage = createAsyncThunk(
  'landscape/deleteProfileImage',
  landscapeService.saveLandscape,
  (landscape, { successKey }) => ({
    severity: 'success',
    content: successKey,
    params: { name: landscape.name },
  })
);
export const leaveLandscape = createAsyncThunk(
  'landscape/leaveLandscape',
  landscapeService.leaveLandscape
);
export const joinLandscape = createAsyncThunk(
  'landscape/joinLandscape',
  landscapeService.joinLandscape
);
export const leaveLandscapeFromList = createAsyncThunk(
  'landscape/leaveLandscapeFromList',
  landscapeService.leaveLandscapeFromList
);
export const joinLandscapeFromList = createAsyncThunk(
  'landscape/joinLandscapeFromList',
  landscapeService.joinLandscapeFromList
);
export const changeMemberRole = createAsyncThunk(
  'landscape/changeMemberRole',
  landscapeService.changeMemberRole
);
export const removeMember = createAsyncThunk(
  'landscape/removeMember',
  landscapeService.removeMember
);

const updateView = (state, action) => ({
  ...state,
  view: {
    fetching: false,
    refreshing: false,
    message: null,
    landscape: action.payload,
  },
});

const landscapeSlice = createSlice({
  name: 'landscape',
  initialState,

  reducers: {
    setFormNewValues: state => ({
      ...state,
      form: initialState.form,
    }),
  },

  extraReducers: builder => {
    builder.addCase(fetchLandscapes.pending, state => ({
      ...state,
      list: initialState.list,
    }));

    builder.addCase(fetchLandscapes.rejected, (state, action) => ({
      ...state,
      list: {
        fetching: false,
        landscapes: [],
      },
    }));

    builder.addCase(fetchLandscapes.fulfilled, (state, action) => ({
      ...state,
      list: {
        fetching: false,
        landscapes: action.payload,
      },
    }));

    builder.addCase(fetchLandscapeProfile.pending, state => ({
      ...state,
      profile: initialState.profile,
    }));

    builder.addCase(fetchLandscapeProfile.rejected, (state, action) => ({
      ...state,
      profile: {
        ...state.profile,
        fetching: false,
        message: {
          severity: 'error',
          content: action.payload,
        },
      },
    }));

    builder.addCase(fetchLandscapeProfile.fulfilled, (state, action) => ({
      ...state,
      profile: {
        fetching: false,
        message: null,
        landscape: action.payload,
      },
    }));

    builder.addCase(fetchLandscapeView.pending, state => ({
      ...state,
      view: initialState.view,
    }));

    builder.addCase(fetchLandscapeView.rejected, (state, action) => ({
      ...state,
      view: {
        ...state.view,
        fetching: false,
        message: {
          severity: 'error',
          content: action.payload,
        },
      },
    }));

    builder.addCase(fetchLandscapeView.fulfilled, updateView);

    builder.addCase(
      refreshLandscapeView.pending,
      _.set('view.refreshing', true)
    );

    builder.addCase(refreshLandscapeView.fulfilled, updateView);

    builder.addCase(
      refreshLandscapeView.rejected,
      _.set('view.refreshing', false)
    );

    builder.addCase(fetchLandscapeForm.pending, state => ({
      ...state,
      form: initialState.form,
    }));

    builder.addCase(fetchLandscapeForm.fulfilled, (state, action) => ({
      ...state,
      form: {
        fetching: false,
        message: null,
        landscape: action.payload,
        success: false,
      },
    }));

    builder.addCase(fetchLandscapeForm.rejected, (state, action) => ({
      ...state,
      form: {
        ...state.form,
        fetching: false,
      },
    }));

    builder.addCase(
      fetchLandscapeForMembers.pending,
      _.set('members', initialState.members)
    );

    builder.addCase(fetchLandscapeForMembers.fulfilled, (state, action) =>
      _.set(
        'members',
        {
          fetching: false,
          data: action.payload,
        },
        state
      )
    );

    builder.addCase(
      fetchLandscapeForMembers.rejected,
      _.set('members', initialState.members)
    );

    builder.addCase(saveLandscape.pending, state => ({
      ...state,
      form: {
        ...state.form,
        saving: true,
      },
    }));

    builder.addCase(saveLandscape.fulfilled, (state, action) => ({
      ...state,
      form: {
        ...state.form,
        saving: false,
        landscape: action.payload,
        success: true,
      },
    }));

    builder.addCase(saveLandscape.rejected, (state, action) => ({
      ...state,
      form: {
        ...state.form,
        saving: false,
      },
    }));

    builder.addCase(fetchLandscapeUpload.pending, state => ({
      ...state,
      sharedDataUpload: initialState.sharedDataUpload,
    }));

    builder.addCase(fetchLandscapeUpload.fulfilled, (state, action) => ({
      ...state,
      sharedDataUpload: {
        ...state.sharedDataUpload,
        fetching: false,
        landscape: action.payload,
      },
    }));

    builder.addCase(fetchLandscapeUpload.rejected, (state, action) => ({
      ...state,
      sharedDataUpload: {
        ...state.sharedDataUpload,
        fetching: false,
      },
    }));

    builder.addCase(uploadProfileImage.rejected, (state, action) => ({
      ...state,
      uploadProfileImage: {
        uploading: false,
      },
    }));

    builder.addCase(uploadProfileImage.fulfilled, (state, action) => ({
      ...state,
      uploadProfileImage: {
        uploading: false,
      },
    }));

    builder.addCase(uploadProfileImage.pending, state => ({
      ...state,
      uploadProfileImage: {
        uploading: true,
      },
    }));

    builder.addCase(deleteProfileImage.pending, state => ({
      ...state,
      profile: {
        ...state.profile,
        deletingProfileImage: true,
      },
    }));

    builder.addCase(deleteProfileImage.rejected, state => ({
      ...state,
      profile: {
        ...state.profile,
        deletingProfileImage: false,
      },
    }));

    builder.addCase(deleteProfileImage.fulfilled, (state, action) => ({
      ...state,
      profile: {
        ...state.profile,
        deletingProfileImage: false,
        landscape: {
          ...state.profile.landscape,
          profileImage: '',
          profileImageDescription: '',
        },
      },
    }));

    builder.addCase(leaveLandscape.pending, (state, action) =>
      _.set(
        `view.landscape.membershipsInfo.accountMembership.fetching`,
        true,
        state
      )
    );
    builder.addCase(leaveLandscape.fulfilled, updateView);
    builder.addCase(leaveLandscape.rejected, (state, action) =>
      _.set(
        `view.landscape.membershipsInfo.accountMembership.fetching`,
        false,
        state
      )
    );

    builder.addCase(joinLandscape.pending, (state, action) =>
      _.set(
        `view.landscape.membershipsInfo.accountMembership.fetching`,
        true,
        state
      )
    );
    builder.addCase(joinLandscape.fulfilled, updateView);
    builder.addCase(joinLandscape.rejected, (state, action) =>
      _.set(
        `view.landscape.membershipsInfo.accountMembership.fetching`,
        false,
        state
      )
    );

    builder.addCase(leaveLandscapeFromList.pending, (state, action) => {
      return updateLandscapeListItem(
        state,
        action.meta.arg.landscapeSlug,
        _.set('accountMembership.fetching', true)
      );
    });
    builder.addCase(leaveLandscapeFromList.fulfilled, (state, action) => {
      return updateLandscapeListItem(
        state,
        action.meta.arg.landscapeSlug,
        () => action.payload
      );
    });
    builder.addCase(leaveLandscapeFromList.rejected, (state, action) => {
      return updateLandscapeListItem(
        state,
        action.meta.arg.landscapeSlug,
        _.set('accountMembership.fetching', false)
      );
    });

    builder.addCase(joinLandscapeFromList.pending, (state, action) => {
      return updateLandscapeListItem(
        state,
        action.meta.arg.landscapeSlug,
        _.set('accountMembership.fetching', true)
      );
    });
    builder.addCase(joinLandscapeFromList.fulfilled, (state, action) => {
      return updateLandscapeListItem(
        state,
        action.meta.arg.landscapeSlug,
        () => action.payload
      );
    });
    builder.addCase(joinLandscapeFromList.rejected, (state, action) => {
      return updateLandscapeListItem(
        state,
        action.meta.arg.landscapeSlug,
        _.set('accountMembership.fetching', false)
      );
    });

    builder.addCase(changeMemberRole.pending, (state, action) => {
      return updateMemberItem(
        state,
        action.meta.arg.email,
        _.set('fetching', true)
      );
    });
    builder.addCase(changeMemberRole.fulfilled, (state, action) => {
      return updateMemberItem(
        state,
        action.meta.arg.email,
        () => action.payload
      );
    });
    builder.addCase(changeMemberRole.rejected, (state, action) => {
      return updateMemberItem(
        state,
        action.meta.arg.email,
        _.set('fetching', false)
      );
    });

    builder.addCase(removeMember.pending, (state, action) => {
      return updateMemberItem(
        state,
        action.meta.arg.email,
        _.set('fetching', true)
      );
    });
    builder.addCase(removeMember.fulfilled, (state, action) => {
      return updateMemberItem(state, action.meta.arg.email, () => null);
    });
    builder.addCase(removeMember.rejected, (state, action) => {
      return updateMemberItem(
        state,
        action.meta.arg.email,
        _.set('fetching', false)
      );
    });
  },
});

export const {
  setFormNewValues,
  fetchLandscapesPending,
  fetchLandscapesRejected,
  fetchLandscapesFulfilled,
  fetchLandscapeViewPending,
  fetchLandscapeViewRejected,
  fetchLandscapeViewFulfilled,
} = landscapeSlice.actions;

export default landscapeSlice.reducer;

const updateLandscapeListItem = (state, slug, valueGenerator) => {
  return {
    ...state,
    list: {
      ...state.list,
      landscapes: state.list.landscapes.map(landscape =>
        landscape.slug === slug ? valueGenerator(landscape) : landscape
      ),
    },
  };
};

const updateMemberItem = (state, email, valueGenerator) => {
  return _.set(
    'members.data.membershipsInfo.memberships',
    state.members.data.membershipsInfo.memberships
      .map(membership =>
        membership.user.email === email
          ? valueGenerator(membership)
          : membership
      )
      .filter(membership => membership),
    state
  );
};
