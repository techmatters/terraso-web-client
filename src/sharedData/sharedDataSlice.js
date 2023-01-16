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
  (group, { dataEntry }) => ({
    severity: 'success',
    content: 'sharedData.deleted',
    params: { name: dataEntry.name },
  })
);
export const updateSharedData = createAsyncThunk(
  'sharedData/updateSharedData',
  sharedDataService.updateSharedData,
  (group, { dataEntry }) => ({
    severity: 'success',
    content: 'sharedData.updated',
    params: { name: dataEntry.name },
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
    `processing.${action.meta.arg.dataEntry.id}`,
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

  extraReducers: builder => {
    builder.addCase(updateSharedData.pending, setProcessing);
    builder.addCase(updateSharedData.rejected, setProcessing);

    builder.addCase(updateSharedData.fulfilled, (state, action) => ({
      ...state,
      list: {
        ...state.list,
        data: state.list.data.map(item =>
          item.id === action.meta.arg.dataEntry.id ? action.payload : item
        ),
      },
    }));

    builder.addCase(deleteSharedData.pending, setProcessing);
    builder.addCase(deleteSharedData.rejected, setProcessing);

    builder.addCase(deleteSharedData.fulfilled, (state, action) => ({
      ...state,
      list: {
        ...state.list,
        data: state.list.data.filter(
          item => item.id !== action.meta.arg.dataEntry.id
        ),
      },
    }));

    builder.addCase(uploadSharedDataFile.pending, (state, action) =>
      _.set(
        `uploads.files.${action.meta.arg.file.id}`,
        {
          status: UPLOAD_STATUS_UPLOADING,
          data: null,
        },
        state
      )
    );

    builder.addCase(uploadSharedDataFile.fulfilled, (state, action) =>
      _.set(
        `uploads.files.${action.meta.arg.file.id}`,
        {
          status: UPLOAD_STATUS_SUCCESS,
          data: action.payload,
        },
        state
      )
    );

    builder.addCase(uploadSharedDataFile.rejected, (state, action) =>
      _.set(
        `uploads.files.${action.meta.arg.file.id}`,
        {
          status: UPLOAD_STATUS_ERROR,
          data: action.payload.parsedErrors,
        },
        state
      )
    );

    builder.addCase(addSharedDataLink.pending, (state, action) =>
      _.set(
        `uploads.links.${action.meta.arg.link.id}`,
        {
          status: UPLOAD_STATUS_UPLOADING,
          data: null,
        },
        state
      )
    );

    builder.addCase(addSharedDataLink.fulfilled, (state, action) =>
      _.set(
        `uploads.links.${action.meta.arg.link.id}`,
        {
          status: UPLOAD_STATUS_SUCCESS,
          data: action.payload,
        },
        state
      )
    );

    builder.addCase(addSharedDataLink.rejected, (state, action) =>
      _.set(
        `uploads.links.${action.meta.arg.link.id}`,
        {
          status: UPLOAD_STATUS_ERROR,
          data: action.payload.parsedErrors,
        },
        state
      )
    );

    builder.addCase(fetchGroupSharedData.pending, (state, action) => ({
      ...state,
      list: {
        fetching: true,
        data: null,
      },
    }));

    builder.addCase(fetchGroupSharedData.fulfilled, (state, action) => ({
      ...state,
      list: {
        fetching: false,
        data: action.payload,
      },
    }));

    builder.addCase(addVisualizationConfig.pending, state => ({
      ...state,
      visualizationConfigForm: {
        saving: true,
      },
    }));

    builder.addCase(addVisualizationConfig.rejected, state => ({
      ...state,
      visualizationConfigForm: {
        saving: false,
      },
    }));

    builder.addCase(addVisualizationConfig.fulfilled, state => ({
      ...state,
      visualizationConfigForm: {
        saving: false,
      },
    }));

    builder.addCase(fetchVisualizationConfig.pending, state => ({
      ...state,
      visualizationConfig: initialState.visualizationConfig,
    }));

    builder.addCase(fetchVisualizationConfig.rejected, state => ({
      ...state,
      visualizationConfig: {
        fetching: false,
      },
    }));

    builder.addCase(fetchVisualizationConfig.fulfilled, (state, action) => ({
      ...state,
      visualizationConfig: {
        fetching: false,
        data: action.payload,
      },
    }));
  },
});

export const { resetUploads, resetProcessing } = sharedDataSlice.actions;

export default sharedDataSlice.reducer;
