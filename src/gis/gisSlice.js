import { createSlice } from '@reduxjs/toolkit';

import { createAsyncThunk } from 'state/utils';

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
  extraReducers: {
    [parseFileToGeoJSON.pending]: state => ({
      ...state,
      parsing: {
        processing: true,
        error: null,
        geojson: null,
      },
    }),
    [parseFileToGeoJSON.fulfilled]: (state, action) => ({
      ...state,
      parsing: {
        processing: false,
        error: null,
        geojson: action.payload,
      },
    }),
    [parseFileToGeoJSON.rejected]: (state, action) => ({
      ...state,
      parsing: {
        processing: false,
        fileName: action.meta.arg.name,
        error: action.payload.parsedErrors,
      },
    }),
  },
});

export default gisSlice.reducer;
