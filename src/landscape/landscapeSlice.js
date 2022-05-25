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
  view: {
    fetching: true,
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
  landscape => ({
    severity: 'success',
    content: landscape.new ? 'landscape.added' : 'landscape.updated',
    params: { name: landscape.name },
  })
);

const landscapeSlice = createSlice({
  name: 'landscape',
  initialState,
  reducers: {
    setFormNewValues: state => ({
      ...state,
      form: initialState.form,
    }),
  },
  extraReducers: {
    [fetchLandscapes.pending]: state => ({
      ...state,
      list: initialState.list,
    }),
    [fetchLandscapes.rejected]: (state, action) => ({
      ...state,
      list: {
        fetching: false,
        landscapes: [],
      },
    }),
    [fetchLandscapes.fulfilled]: (state, action) => ({
      ...state,
      list: {
        fetching: false,
        landscapes: action.payload,
      },
    }),
    [fetchLandscapeView.pending]: state => ({
      ...state,
      view: initialState.view,
    }),
    [fetchLandscapeView.rejected]: (state, action) => ({
      ...state,
      view: {
        ...state.view,
        fetching: false,
        message: {
          severity: 'error',
          content: action.payload,
        },
      },
    }),
    [fetchLandscapeView.fulfilled]: (state, action) => ({
      ...state,
      view: {
        fetching: false,
        message: null,
        landscape: action.payload,
      },
    }),
    [fetchLandscapeForm.pending]: state => ({
      ...state,
      form: initialState.form,
    }),
    [fetchLandscapeForm.fulfilled]: (state, action) => ({
      ...state,
      form: {
        fetching: false,
        message: null,
        landscape: action.payload,
        success: false,
      },
    }),
    [fetchLandscapeForm.rejected]: (state, action) => ({
      ...state,
      form: {
        ...state.form,
        fetching: false,
      },
    }),
    [fetchLandscapeForMembers.pending]: state =>
      _.set('membersLandscape', initialState.membersLandscape, state),
    [fetchLandscapeForMembers.fulfilled]: (state, action) =>
      _.set(
        'membersLandscape',
        {
          fetching: false,
          data: action.payload,
        },
        state
      ),
    [fetchLandscapeForMembers.rejected]: state =>
      _.set('membersLandscape', initialState.membersLandscape, state),
    [saveLandscape.pending]: state => ({
      ...state,
      form: {
        ...state.form,
        saving: true,
      },
    }),
    [saveLandscape.fulfilled]: (state, action) => ({
      ...state,
      form: {
        ...state.form,
        saving: false,
        landscape: action.payload,
        success: true,
      },
    }),
    [saveLandscape.rejected]: (state, action) => ({
      ...state,
      form: {
        ...state.form,
        saving: false,
      },
    }),
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
