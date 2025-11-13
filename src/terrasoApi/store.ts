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

import {
  combineReducers,
  configureStore,
  Reducer,
  StateFromReducersMapObject,
} from '@reduxjs/toolkit';
import {
  useDispatch as reduxUseDispatch,
  useSelector as reduxUseSelector,
  TypedUseSelectorHook,
} from 'react-redux';
import {
  DispatchFromStoreFactory,
  handleAbortMiddleware,
  sharedReducers,
} from 'terraso-client-shared/store/store';
import { DataEntryNode } from 'terraso-web-client/terrasoApi/shared/graphqlSchema/graphql';

import gisReducer from 'terraso-web-client/gis/gisSlice';
import groupReducer from 'terraso-web-client/group/groupSlice';
import userHomeReducer from 'terraso-web-client/home/homeSlice';
import landscapeReducer from 'terraso-web-client/landscape/landscapeSlice';
import sharedDataReducer, {
  UPLOAD_STATUS_ERROR,
  UPLOAD_STATUS_SUCCESS,
  UPLOAD_STATUS_UPLOADING,
} from 'terraso-web-client/sharedData/sharedDataSlice';
import storyMapReducer from 'terraso-web-client/storyMap/storyMapSlice';
import taxonomiesReducer from 'terraso-web-client/taxonomies/taxonomiesSlice';

type SharedDataState = {
  uploads: {
    files: Record<
      string,
      {
        status:
          | typeof UPLOAD_STATUS_UPLOADING
          | typeof UPLOAD_STATUS_SUCCESS
          | typeof UPLOAD_STATUS_ERROR;
        data: DataEntryNode | null;
      }
    >;
  };
};

const sliceReducers = {
  ...sharedReducers,
  group: groupReducer,
  userHome: userHomeReducer,
  landscape: landscapeReducer,
  sharedData: sharedDataReducer as unknown as Reducer<SharedDataState>,
  taxonomies: taxonomiesReducer,
  gis: gisReducer,
  storyMap: storyMapReducer,
};

const rootReducer = combineReducers(sliceReducers);

export type AppState = StateFromReducersMapObject<typeof sliceReducers>;
export type AppDispatch = DispatchFromStoreFactory<typeof createStore>;

export const createStore = (initialState?: Partial<AppState>) =>
  configureStore({
    middleware: getDefaultMiddleware =>
      getDefaultMiddleware().concat(handleAbortMiddleware),
    reducer: rootReducer,
    preloadedState: initialState,
  });

export const useSelector: TypedUseSelectorHook<AppState> = reduxUseSelector;
export const useDispatch: () => AppDispatch = reduxUseDispatch;

export default createStore;
