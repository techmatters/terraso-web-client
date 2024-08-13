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

import * as gisService from 'gis/gisService';

const initialState = {
  parsing: {
    processing: false,
    error: null,
    geojson: null,
  },
};

export const parseFileToGeoJSON = createAsyncThunk(
  'gis/parseFileToGeoJSON',
  gisService.parseFileToGeoJSON,
  null,
  false
);

const gisSlice = createSlice({
  name: 'gis',
  initialState,
  reducers: {},

  extraReducers: builder => {
    builder.addCase(parseFileToGeoJSON.pending, state => ({
      ...state,
      parsing: {
        processing: true,
        error: null,
        geojson: null,
      },
    }));

    builder.addCase(parseFileToGeoJSON.fulfilled, (state, action) => ({
      ...state,
      parsing: {
        processing: false,
        error: null,
        geojson: action.payload,
      },
    }));

    builder.addCase(parseFileToGeoJSON.rejected, (state, action) => ({
      ...state,
      parsing: {
        processing: false,
        fileName: action.meta.arg.name,
        error: action.payload.parsedErrors,
      },
    }));
  },
});

export default gisSlice.reducer;
