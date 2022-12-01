import { createSlice } from '@reduxjs/toolkit';
import _ from 'lodash/fp';

import { createAsyncThunk } from 'state/utils';

import * as taxonomiesService from 'taxonomies/taxonomiesService';

const initialState = {
  terms: {
    fetching: true,
    values: {},
  },
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
        fetching: true,
      },
    }),
    [fetchTermsForTypes.fulfilled]: (state, action) => ({
      ...state,
      terms: {
        ...state.terms,
        fetching: false,
        values: {
          ...state.terms.values,
          ..._.flow(
            _.toPairs,
            _.map(([type, list]) => [type, { list }]),
            _.fromPairs
          )(action.payload),
        },
      },
    }),
    [fetchTermsForTypes.rejected]: (state, action) => ({
      ...state,
      form: {
        ...state.terms,
        fetching: false,
        values: {
          ...state.terms.values,
          ..._.flow(
            _.map(type => [type, { error: true }]),
            _.fromPairs
          )(action.meta.arg.types),
        },
      },
    }),
  },
});

export default taxonomiesSlice.reducer;
