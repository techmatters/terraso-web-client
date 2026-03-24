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
import { createAsyncThunk } from 'terraso-client-shared/store/utils';

import * as homeService from 'terraso-web-client/home/homeService';
import { setUserStoryMaps } from 'terraso-web-client/storyMap/storyMapSlice';

const initialState = {
  fetching: true,
  error: null,
};

export const fetchHomeStoryMaps = createAsyncThunk(
  'home/fetchStoryMaps',
  (email, currentUser, { dispatch }) =>
    homeService.fetchHomeStoryMaps(email).then(storyMaps => {
      dispatch(setUserStoryMaps(storyMaps));
      return storyMaps;
    })
);

export const homeSlice = createSlice({
  name: 'home',
  initialState,
  reducers: {
    removeStoryMap: (state, action) => ({
      ...state,
      storyMaps: state.storyMaps.filter(
        storyMap => storyMap.id !== action.payload
      ),
    }),
  },

  extraReducers: builder => {
    builder.addCase(fetchHomeStoryMaps.pending, () => initialState);

    builder.addCase(fetchHomeStoryMaps.fulfilled, state => ({
      ...state,
      fetching: false,
      error: null,
    }));

    builder.addCase(fetchHomeStoryMaps.rejected, (state, action) => ({
      ...state,
      fetching: false,
      error: action.payload?.error || action.payload || action.error,
    }));
  },
});

export const { removeStoryMap } = homeSlice.actions;

export default homeSlice.reducer;
