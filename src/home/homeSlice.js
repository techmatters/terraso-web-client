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
