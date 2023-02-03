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

import { setMemberships } from 'group/groupSlice';
import * as groupUtils from 'group/groupUtils';
import * as landscapeService from 'landscape/landscapeService';

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
  membersLandscape: {
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
  async (params, currentUser, { dispatch }) => {
    const landscapes = await landscapeService.fetchLandscapes(
      params,
      currentUser
    );
    dispatch(setMemberships(getMemberships(landscapes)));
    return landscapes;
  }
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
    dispatch(setMemberships(getMemberships([landscape])));
    return landscape;
  }
);
export const refreshLandscapeView = createAsyncThunk(
  'landscape/refreshLandscapeView',
  async (params, currentUser, { dispatch }) => {
    const landscape = await landscapeService.fetchLandscapeToView(
      params,
      currentUser
    );
    dispatch(setMemberships(getMemberships([landscape])));
    return landscape;
  }
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
      _.set('membersLandscape', initialState.membersLandscape)
    );

    builder.addCase(fetchLandscapeForMembers.fulfilled, (state, action) =>
      _.set(
        'membersLandscape',
        {
          fetching: false,
          data: action.payload,
        },
        state
      )
    );

    builder.addCase(
      fetchLandscapeForMembers.rejected,
      _.set('membersLandscape', initialState.membersLandscape)
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

const getMemberships = landscapes => {
  const groups = landscapes
    .map(landscape => landscape.defaultGroup)
    .filter(group => group.slug);
  return groupUtils.getMemberships(groups);
};
