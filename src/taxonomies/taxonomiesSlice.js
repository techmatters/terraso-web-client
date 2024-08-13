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

  extraReducers: builder => {
    builder.addCase(fetchTermsForTypes.pending, (state, action) => ({
      ...state,
      terms: {
        ...state.terms,
        fetching: true,
      },
    }));

    builder.addCase(fetchTermsForTypes.fulfilled, (state, action) => ({
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
    }));

    builder.addCase(fetchTermsForTypes.rejected, (state, action) => ({
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
    }));
  },
});

export default taxonomiesSlice.reducer;
