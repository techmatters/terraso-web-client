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

import * as storyMapService from 'storyMap/storyMapService';

const initialState = {
  form: {
    fetching: true,
    saving: false,
    data: null,
  },
  view: {
    fetching: true,
    data: null,
    deleting: false,
  },
};

export const fetchStoryMap = createAsyncThunk(
  'storyMap/fetchStoryMap',
  storyMapService.fetchStoryMap
);
export const fetchStoryMapForm = createAsyncThunk(
  'storyMap/fetchStoryMapForm',
  storyMapService.fetchStoryMap
);
export const addStoryMap = createAsyncThunk(
  'storyMap/addStoryMap',
  storyMapService.addStoryMap,
  (storyMap, { storyMap: { config } }) => ({
    severity: 'success',
    content: 'storyMap.added_story_map',
    params: { title: config.title },
  })
);
export const updateStoryMap = createAsyncThunk(
  'storyMap/updateStoryMap',
  storyMapService.updateStoryMap,
  (storyMap, { storyMap: { config } }) => ({
    severity: 'success',
    content: 'storyMap.update_story_map',
    params: { title: config.title },
  })
);
export const deleteStoryMap = createAsyncThunk(
  'storyMap/addStoryMap',
  storyMapService.deleteStoryMap,
  (storyMap, { config }) => ({
    severity: 'success',
    content: 'storyMap.deleted_story_map',
    params: {
      title: config.title,
    },
  })
);

const storyMapSlice = createSlice({
  name: 'storyMap',
  initialState,

  reducers: {
    resetForm: state => ({
      ...state,
      form: initialState.form,
    }),
  },

  extraReducers: builder => {
    builder.addCase(fetchStoryMap.pending, state => ({
      ...state,
      view: initialState.view,
    }));

    builder.addCase(fetchStoryMap.rejected, state => ({
      ...state,
      view: {
        fetching: false,
      },
    }));

    builder.addCase(fetchStoryMap.fulfilled, (state, action) => ({
      ...state,
      view: {
        fetching: false,
        data: action.payload,
      },
    }));

    builder.addCase(fetchStoryMapForm.pending, state => ({
      ...state,
      form: initialState.form,
    }));
    builder.addCase(fetchStoryMapForm.rejected, state => ({
      ...state,
      form: {
        fetching: false,
      },
    }));
    builder.addCase(fetchStoryMapForm.fulfilled, (state, action) => ({
      ...state,
      form: {
        fetching: false,
        data: action.payload,
      },
    }));

    builder.addCase(addStoryMap.pending, state => ({
      ...state,
      form: {
        saving: true,
      },
    }));
    builder.addCase(addStoryMap.rejected, state => ({
      ...state,
      form: {
        saving: false,
      },
    }));
    builder.addCase(addStoryMap.fulfilled, state => ({
      ...state,
      form: {
        saving: false,
      },
    }));

    builder.addCase(updateStoryMap.pending, state => ({
      ...state,
      form: {
        ...state.form,
        saving: true,
      },
    }));
    builder.addCase(updateStoryMap.rejected, state => ({
      ...state,
      form: {
        ...state.form,
        saving: false,
      },
    }));
    builder.addCase(updateStoryMap.fulfilled, state => ({
      ...state,
      form: {
        ...state.form,
        saving: false,
      },
    }));
  },
});

export const { resetForm } = storyMapSlice.actions;

export default storyMapSlice.reducer;
