import { createSlice } from '@reduxjs/toolkit';
import _ from 'lodash/fp';

import { createAsyncThunk } from 'state/utils';

import * as sharedDataService from 'sharedData/sharedDataService';

export const UPLOAD_STATUS_UPLOADING = 'uploading';
export const UPLOAD_STATUS_SUCCESS = 'success';
export const UPLOAD_STATUS_ERROR = 'error';

const initialState = {
  uploads: null,
};

export const uploadSharedData = createAsyncThunk(
  'sharedData/uploadSharedData',
  sharedDataService.uploadSharedData,
  null,
  false
);

const sharedDataSlice = createSlice({
  name: 'sharedData',
  initialState,
  reducers: {
    resetUploads: state => ({
      ...state,
      uploads: initialState.uploads,
    }),
  },
  extraReducers: {
    [uploadSharedData.pending]: (state, action) =>
      _.set(
        `uploads.${action.meta.arg.file.id}`,
        {
          status: UPLOAD_STATUS_UPLOADING,
          data: null,
        },
        state
      ),
    [uploadSharedData.fulfilled]: (state, action) =>
      _.set(
        `uploads.${action.meta.arg.file.id}`,
        {
          status: UPLOAD_STATUS_SUCCESS,
          data: action.payload,
        },
        state
      ),
    [uploadSharedData.rejected]: (state, action) =>
      _.set(
        `uploads.${action.meta.arg.file.id}`,
        {
          status: UPLOAD_STATUS_ERROR,
          data: action.payload,
        },
        state
      ),
  },
});

export const { resetUploads } = sharedDataSlice.actions;

export default sharedDataSlice.reducer;
