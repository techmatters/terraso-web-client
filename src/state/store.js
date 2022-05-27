import { configureStore } from '@reduxjs/toolkit';

import notificationsReducer from 'notifications/notificationsSlice';

import accountReducer from 'account/accountSlice';
import groupReducer from 'group/groupSlice';
import userHomeReducer from 'home/homeSlice';
import landscapeReducer from 'landscape/landscapeSlice';
import sharedDataReducer from 'sharedData/sharedDataSlice';

const createStore = intialState =>
  configureStore({
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
