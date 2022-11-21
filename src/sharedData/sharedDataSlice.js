import { createSlice } from '@reduxjs/toolkit';
import _ from 'lodash/fp';

import { createAsyncThunk } from 'state/utils';

import * as sharedDataService from 'sharedData/sharedDataService';

export const UPLOAD_STATUS_UPLOADING = 'uploading';
export const UPLOAD_STATUS_SUCCESS = 'success';
export const UPLOAD_STATUS_ERROR = 'error';

const initialState = {
  uploads: {
    files: {},
    links: {},
  },
  processing: {},
  list: {
    fetching: true,
    data: null,
  },
  visualizationConfigForm: {
    saving: false,
  },
  visualizationConfig: {
    fetching: true,
    data: null,
    deleting: false,
  },
};

export const uploadSharedDataFile = createAsyncThunk(
  'sharedData/uploadSharedDataFile',
  sharedDataService.uploadSharedDataFile,
  null,
  false
);
export const addSharedDataLink = createAsyncThunk(
  'sharedData/addSharedDataLink',
  sharedDataService.addSharedDataLink,
  null,
  false
);
export const deleteSharedData = createAsyncThunk(
  'sharedData/deleteSharedData',
  sharedDataService.deleteSharedData,
  (group, { file }) => ({
    severity: 'success',
    content: 'sharedData.deleted',
    params: { name: file.name },
  })
);
export const updateSharedData = createAsyncThunk(
  'sharedData/updateSharedData',
  sharedDataService.updateSharedData,
  (group, { file }) => ({
    severity: 'success',
    content: 'sharedData.updated',
    params: { name: file.name },
  })
);
export const fetchGroupSharedData = createAsyncThunk(
  'sharedData/fetchGroupSharedData',
  sharedDataService.fetchGroupSharedData
);

export const addVisualizationConfig = createAsyncThunk(
  'sharedData/addVisualizationConfig',
  sharedDataService.addVisualizationConfig,
  (visualization, { selectedFile }) => ({
    severity: 'success',
    content: 'sharedData.added_visualization_config',
    params: { name: selectedFile.name },
  })
);
export const fetchVisualizationConfig = createAsyncThunk(
  'sharedData/fetchVisualizationConfig',
  sharedDataService.fetchVisualizationConfig
);
export const deleteVisualizationConfig = createAsyncThunk(
  'sharedData/deleteVisualizationConfig',
  sharedDataService.deleteVisualizationConfig,
  (visualization, config) => ({
    severity: 'success',
    content: 'sharedData.deleted_visualization_config',
    params: {
      mapTitle: _.get('title', config),
    },
  })
);

const setProcessing = (state, action) =>
  _.set(
    `processing.${action.meta.arg.file.id}`,
    action.meta.requestStatus === 'pending',
    state
  );

const sharedDataSlice = createSlice({
  name: 'sharedData',
  initialState,
  reducers: {
    resetUploads: state => ({
      ...state,
      uploads: initialState.uploads,
    }),
    resetProcessing: (state, action) => ({
      ...state,
      processing: _.omit(action.payload, state.processing),
    }),
  },
  extraReducers: {
    [updateSharedData.pending]: setProcessing,
    [updateSharedData.rejected]: setProcessing,
    [deleteSharedData.pending]: setProcessing,
    [deleteSharedData.rejected]: setProcessing,
    [uploadSharedDataFile.pending]: (state, action) =>
      _.set(
        `uploads.files.${action.meta.arg.file.id}`,
        {
          status: UPLOAD_STATUS_UPLOADING,
          data: null,
        },
        state
      ),
    [uploadSharedDataFile.fulfilled]: (state, action) =>
      _.set(
        `uploads.files.${action.meta.arg.file.id}`,
        {
          status: UPLOAD_STATUS_SUCCESS,
          data: action.payload,
        },
        state
      ),
    [uploadSharedDataFile.rejected]: (state, action) =>
      _.set(
        `uploads.files.${action.meta.arg.file.id}`,
        {
          status: UPLOAD_STATUS_ERROR,
          data: action.payload.parsedErrors,
        },
        state
      ),
    [addSharedDataLink.pending]: (state, action) =>
      _.set(
        `uploads.links.${action.meta.arg.link.id}`,
        {
          status: UPLOAD_STATUS_UPLOADING,
          data: null,
        },
        state
      ),
    [addSharedDataLink.fulfilled]: (state, action) =>
      _.set(
        `uploads.links.${action.meta.arg.link.id}`,
        {
          status: UPLOAD_STATUS_SUCCESS,
          data: action.payload,
        },
        state
      ),
    [addSharedDataLink.rejected]: (state, action) =>
      _.set(
        `uploads.links.${action.meta.arg.link.id}`,
        {
          status: UPLOAD_STATUS_ERROR,
          data: action.payload.parsedErrors,
        },
        state
      ),
    [fetchGroupSharedData.pending]: (state, action) => ({
      ...state,
      list: {
        fetching: true,
        data: null,
      },
    }),
    [fetchGroupSharedData.fulfilled]: (state, action) => ({
      ...state,
      list: {
        fetching: false,
        data: action.payload,
      },
    }),
    [addVisualizationConfig.pending]: state => ({
      ...state,
      visualizationConfigForm: {
        saving: true,
      },
    }),
    [addVisualizationConfig.rejected]: state => ({
      ...state,
      visualizationConfigForm: {
        saving: false,
      },
    }),
    [addVisualizationConfig.fulfilled]: state => ({
      ...state,
      visualizationConfigForm: {
        saving: false,
      },
    }),
    [fetchVisualizationConfig.pending]: state => ({
      ...state,
      visualizationConfig: initialState.visualizationConfig,
    }),
    [fetchVisualizationConfig.rejected]: state => ({
      ...state,
      visualizationConfig: {
        fetching: false,
      },
    }),
    [fetchVisualizationConfig.fulfilled]: (state, action) => ({
      ...state,
      visualizationConfig: {
        fetching: false,
        data: action.payload,
      },
    }),
  },
});

export const { resetUploads, resetProcessing } = sharedDataSlice.actions;

export default sharedDataSlice.reducer;
