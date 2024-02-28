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
  sharedResources: {
    fetching: true,
    data: null,
  },
  dataEntries: {
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
  sharedResource: {
    fetching: true,
    data: null,
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
export const fetchDataEntries = createAsyncThunk(
  'sharedData/fetchDataEntries',
  sharedDataService.fetchDataEntries
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
export const updateSharedResource = createAsyncThunk(
  'sharedData/updateSharedResource',
  sharedDataService.updateSharedResource
);
export const fetchSharedResource = createAsyncThunk(
  'sharedData/fetchSharedResource',
  sharedDataService.fetchSharedResource,
  null,
  null
);

const setProcessing = (state, requestStatus, sharedResource) =>
  _.set(`processing.${sharedResource.id}`, requestStatus === 'pending', state);

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
    setSharedResourcesList: (state, action) => ({
      ...state,
      sharedResources: {
        data: action.payload,
        fetching: false,
      },
    }),
  },

  extraReducers: builder => {
    builder.addCase(updateSharedData.pending, (state, action) =>
      setProcessing(
        state,
        action.meta.requestStatus,
        action.meta.arg.sharedResource
      )
    );
    builder.addCase(updateSharedData.rejected, (state, action) =>
      setProcessing(
        state,
        action.meta.requestStatus,
        action.meta.arg.sharedResource
      )
    );
    builder.addCase(updateSharedData.fulfilled, (state, action) => ({
      ...state,
      sharedResources: {
        ...state.sharedResources,
        data: state.sharedResources.data.map(item =>
          item.id === action.meta.arg.sharedResource.id
            ? { ...item, dataEntry: action.payload }
            : item
        ),
      },
    }));

    builder.addCase(updateSharedResource.pending, (state, action) =>
      setProcessing(
        state,
        action.meta.requestStatus,
        action.meta.arg.sharedResource
      )
    );
    builder.addCase(updateSharedResource.rejected, (state, action) => {
      return setProcessing(
        state,
        action.meta.requestStatus,
        action.meta.arg.sharedResource
      );
    });
    builder.addCase(updateSharedResource.fulfilled, (state, action) => {
      return {
        ...state,
        processing: _.omit(action.meta.arg.sharedResource.id, {
          ...state.processing,
        }),
        sharedResources: {
          ...state.sharedResources,
          data: state.sharedResources.data.map(item =>
            item.id === action.meta.arg.sharedResource.id
              ? action.payload
              : item
          ),
        },
      };
    });

    builder.addCase(deleteSharedData.pending, (state, action) =>
      setProcessing(
        state,
        action.meta.requestStatus,
        action.meta.arg.sharedResource
      )
    );
    builder.addCase(deleteSharedData.rejected, (state, action) =>
      setProcessing(
        state,
        action.meta.requestStatus,
        action.meta.arg.sharedResource
      )
    );

    builder.addCase(deleteSharedData.fulfilled, (state, action) => ({
      ...state,
      sharedResources: {
        ...state.sharedResources,
        data: state.sharedResources.data.filter(
          item => item.id !== action.meta.arg.sharedResource.id
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

    builder.addCase(fetchDataEntries.pending, (state, action) => ({
      ...state,
      dataEntries: {
        fetching: true,
        data: null,
      },
    }));

    builder.addCase(fetchDataEntries.fulfilled, (state, action) => ({
      ...state,
      dataEntries: {
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

    builder.addCase(fetchSharedResource.pending, state => ({
      ...state,
      sharedResource: initialState.sharedResource,
    }));
    builder.addCase(fetchSharedResource.rejected, state => ({
      ...state,
      sharedResource: {
        fetching: false,
        data: null,
      },
    }));
    builder.addCase(fetchSharedResource.fulfilled, (state, action) => ({
      ...state,
      sharedResource: {
        fetching: false,
        data: action.payload,
      },
    }));
  },
});

export const { resetUploads, resetProcessing, setSharedResourcesList } =
  sharedDataSlice.actions;

export default sharedDataSlice.reducer;
