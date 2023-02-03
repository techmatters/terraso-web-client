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

import { createAsyncThunk } from 'state/utils';

import * as homeService from 'home/homeService';

const initialState = {
  groups: [],
  landscapes: [],
  fetching: true,
  error: null,
};

export const fetchHomeData = createAsyncThunk(
  'home/fetchData',
  homeService.fetchHomeData
);

export const homeSlice = createSlice({
  name: 'home',
  initialState,
  reducers: {},

  extraReducers: builder => {
    builder.addCase(fetchHomeData.pending, () => initialState);

    builder.addCase(fetchHomeData.fulfilled, (state, action) => ({
      ...state,
      fetching: false,
      error: null,
      groups: action.payload.groups,
      landscapes: action.payload.landscapes,
      landscapesDiscovery: action.payload.landscapesDiscovery,
    }));

    builder.addCase(fetchHomeData.rejected, (state, action) => ({
      ...state,
      fetching: false,
      error: action.payload.error,
    }));
  },
});

export default homeSlice.reducer;
