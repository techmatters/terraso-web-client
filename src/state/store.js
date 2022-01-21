import { configureStore } from '@reduxjs/toolkit';

import accountReducer from 'account/accountSlice';
import userHomeReducer from 'home/homeSlice';
import groupReducer from 'group/groupSlice';
import landscapeReducer from 'landscape/landscapeSlice';
import notificationsReducer from 'notifications/notificationsSlice';

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
