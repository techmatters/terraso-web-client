import { createSlice } from '@reduxjs/toolkit';
import _ from 'lodash/fp';

import { createAsyncThunk } from 'state/utils';

import * as taxonomiesService from 'taxonomies/taxonomiesService';

const initialState = {
  terms: {},
};

export const fetchTermsForTypes = createAsyncThunk(
  'taxonomies/fetchTermsForTypes',
  taxonomiesService.fetchTermsForTypes
);

const taxonomiesSlice = createSlice({
  name: 'taxonomies',
  initialState,
  reducers: {},
  extraReducers: {
    [fetchTermsForTypes.pending]: (state, action) => ({
      ...state,
      terms: {
        ...state.terms,
        ..._.flow(
          _.map(type => [type, { fetching: true }]),
          _.fromPairs
        )(action.meta.arg.types),
      },
    }),
    [fetchTermsForTypes.fulfilled]: (state, action) => ({
      ...state,
      terms: {
        ...state.terms,
        ..._.flow(
          _.toPairs,
          _.map(([type, list]) => [type, { list, fetching: false }]),
          _.fromPairs
        )(action.payload),
      },
    }),
    [fetchTermsForTypes.rejected]: (state, action) => ({
      ...state,
      form: {
        ...state.terms,
        ..._.flow(
          _.map(type => [type, { fetching: false, error: true }]),
          _.fromPairs
        )(action.meta.arg.types),
      },
    }),
  },
});

export default taxonomiesSlice.reducer;
