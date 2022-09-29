import { configureStore } from '@reduxjs/toolkit';
import _ from 'lodash/fp';

import notificationsReducer from 'notifications/notificationsSlice';

import accountReducer from 'account/accountSlice';
import groupReducer from 'group/groupSlice';
import userHomeReducer from 'home/homeSlice';
import landscapeReducer from 'landscape/landscapeSlice';
import sharedDataReducer from 'sharedData/sharedDataSlice';

const handleAbortMiddleware = store => next => action => {
  if (_.getOr(false, 'meta.aborted', action)) {
    next({
      ...action,
      type: action.type.replace('rejected', 'aborted'),
    });
    return;
  }
  next(action);
};

const createStore = intialState =>
  configureStore({
    middleware: getDefaultMiddleware =>
      getDefaultMiddleware().concat(handleAbortMiddleware),
    reducer: {
      account: accountReducer,
      userHome: userHomeReducer,
      group: groupReducer,
      landscape: landscapeReducer,
      notifications: notificationsReducer,
      sharedData: sharedDataReducer,
    },
    preloadedState: intialState,
  });

export default createStore;
