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
import { Middleware, combineReducers, configureStore } from '@reduxjs/toolkit';
import _ from 'lodash/fp';
import accountReducer from 'terrasoApi/account/accountSlice';

import notificationsReducer from 'notifications/notificationsSlice';

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

// Using some advanced TypeScript features here: ReturnType gets the
// return type of a function type, and since reducers are just functions
// from (state, action) to state this gives us our state type. since we have
// a store factory instead of a store we need to get our dispatch
// type from the return type of the store factory instead of from the store
// directly as normal. background reading:
// https://redux-toolkit.js.org/usage/usage-with-typescript#getting-the-state-type
export type AppState = ReturnType<typeof reducer>;
export type AppDispatch = ReturnType<typeof createStore>['dispatch'];

const createStore = (intialState?: AppState) =>
  configureStore({
    middleware: getDefaultMiddleware =>
      getDefaultMiddleware().concat(handleAbortMiddleware),
    reducer: reducer,
    preloadedState: intialState,
  });

export default createStore;
