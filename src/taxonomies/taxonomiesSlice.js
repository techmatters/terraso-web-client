import { createSlice } from '@reduxjs/toolkit';
import _ from 'lodash/fp';
import * as taxonomiesService from 'taxonomies/taxonomiesService';

import { createAsyncThunk } from 'state/utils';

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
  reducers: {
    setTerms: (state, action) => ({
      ...state,
      terms: {
        ...state.terms,
        [action.payload.type]: action.payload.terms,
      },
    }),
  },
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

export const { setTerms } = taxonomiesSlice.actions;

export default taxonomiesSlice.reducer;
