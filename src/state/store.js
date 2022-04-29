import { configureStore } from '@reduxjs/toolkit';

import notificationsReducer from 'notifications/notificationsSlice';

import accountReducer from 'account/accountSlice';
import groupReducer from 'group/groupSlice';
import userHomeReducer from 'home/homeSlice';
import landscapeReducer from 'landscape/landscapeSlice';

const createStore = intialState =>
  configureStore({
    reducer: {
      account: accountReducer,
      userHome: userHomeReducer,
      group: groupReducer,
      landscape: landscapeReducer,
      notifications: notificationsReducer,
    },
    preloadedState: intialState,
  });

export default createStore;
