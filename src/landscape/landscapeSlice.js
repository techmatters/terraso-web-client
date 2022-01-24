import _ from 'lodash/fp';
import { createSlice } from '@reduxjs/toolkit';

import { createAsyncThunk } from 'state/utils';
import * as landscapeService from 'landscape/landscapeService';
import { setMemberships } from 'group/groupSlice';
import * as groupUtils from 'group/groupUtils';

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
    message: null,
    landscape: null,
  },
  membersLandscape: {
    data: null,
    fetching: true,
  },
};

export const fetchLandscapes = createAsyncThunk(
  'landscape/fetchLandscapes',
  async (params, currentUser, { dispatch }) => {
    const landscapes = await landscapeService.fetchLandscapes(params);
    dispatch(setMemberships(getMemberships(landscapes)));
    return landscapes;
  }
);
export const fetchLandscapeView = createAsyncThunk(
  'landscape/fetchLandscapeView',
  async (params, currentUser, { dispatch }) => {
    const landscape = await landscapeService.fetchLandscapeToView(params);
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
  () => ({ severity: 'success', content: 'landscape.form_message_success' })
);

const landscapeSlice = createSlice({
  name: 'landscape',
  initialState,
  reducers: {
    setFormNewValues: state => ({
      ...state,
      form: {
        ...state.form,
        landscape: null,
        fetching: false,
      },
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
        fetching: true,
      },
    }),
    [saveLandscape.fulfilled]: (state, action) => ({
      ...state,
      form: {
        ...state.form,
        fetching: false,
        landscape: action.payload,
      },
    }),
    [saveLandscape.rejected]: (state, action) => ({
      ...state,
      form: {
        ...state.form,
        fetching: false,
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
