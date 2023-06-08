/*
 * Copyright © 2023 Technology Matters
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
  configureStore,
  Middleware,
  ReducersMapObject,
  StateFromReducersMapObject,
} from '@reduxjs/toolkit';
import { ToolkitStore } from '@reduxjs/toolkit/dist/configureStore';
import _ from 'lodash/fp';
import accountReducer from 'terrasoApi/shared/account/accountSlice';
import membershipsReducer from 'terrasoApi/shared/memberships/membershipsSlice';
import notificationsReducer from 'terrasoApi/shared/notifications/notificationsSlice';

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

const sharedReducers = {
  account: accountReducer,
  memberships: membershipsReducer,
  notifications: notificationsReducer,
};

// Using some advanced TypeScript features here: since we have
// a store factory instead of a store we need to get our dispatch and state
// types from the return type of the store factory instead of from the store
// directly as normal. background reading:
// https://redux-toolkit.js.org/usage/usage-with-typescript#getting-the-state-type
export type StateFromStoreFactory<T extends (_: any) => ToolkitStore> =
  ReturnType<ReturnType<T>['getState']>;
export type DispatchFromStoreFactory<T extends (_: any) => ToolkitStore> =
  ReturnType<T>['dispatch'];

const createStoreFactory = <S>(reducers: ReducersMapObject<S>) => {
  return (intialState?: SharedState & S) =>
    configureStore({
      middleware: getDefaultMiddleware =>
        getDefaultMiddleware().concat(handleAbortMiddleware),
      reducer: { ...sharedReducers, ...reducers },
      preloadedState: intialState,
    });
};

export type SharedState = StateFromReducersMapObject<typeof sharedReducers>;
export type SharedDispatch = DispatchFromStoreFactory<
  ReturnType<typeof createStoreFactory>
>;

export default createStoreFactory;
