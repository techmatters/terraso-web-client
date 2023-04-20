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
  Middleware,
  Reducer,
  combineReducers,
  configureStore,
} from '@reduxjs/toolkit';
import _ from 'lodash/fp';

import notificationsReducer from 'notifications/notificationsSlice';
import accountReducer from 'state/account/accountSlice';

import gisReducer from 'gis/gisSlice';
import groupReducer from 'group/groupSlice';
import userHomeReducer from 'home/homeSlice';
import landscapeReducer from 'landscape/landscapeSlice';
import sharedDataReducer from 'sharedData/sharedDataSlice';
import storyMapReducer from 'storyMap/storyMapSlice';
import taxonomiesReducer from 'taxonomies/taxonomiesSlice';

const handleAbortMiddleware: Middleware = () => next => action => {
  if (_.getOr(false, 'meta.aborted', action)) {
    next({
      ...action,
      type: action.type.replace('rejected', 'aborted'),
    });
    return;
  }
  next(action);
};

const reducer = combineReducers({
  account: accountReducer,
  userHome: userHomeReducer,
  group: groupReducer,
  landscape: landscapeReducer,
  notifications: notificationsReducer,
  sharedData: sharedDataReducer,
  taxonomies: taxonomiesReducer,
  gis: gisReducer,
  storyMap: storyMapReducer,
});

type GetReducerType<T extends Reducer> = T extends Reducer<infer S> ? S : never;
export type AppState = GetReducerType<typeof reducer>;
export type AppDispatch = ReturnType<typeof createStore>['dispatch'];

const createStore = (intialState: AppState) =>
  configureStore({
    middleware: getDefaultMiddleware =>
      getDefaultMiddleware().concat(handleAbortMiddleware),
    reducer: reducer,
    preloadedState: intialState,
  });

export default createStore;
