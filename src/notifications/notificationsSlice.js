import _ from 'lodash/fp';

import { createSlice } from '@reduxjs/toolkit';
import { v4 as uuidv4 } from 'uuid';

const initialState = {
  messages: {},
};

const notificationsSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    addMessage: (state, action) => ({
      ...state,
      messages: {
        ...state.messages,
        [uuidv4()]: action.payload,
      },
    }),
    removeMessage: (state, action) => ({
      ...state,
      messages: _.omit(action.payload, state.messages),
    }),
  },
  extraReducers: {},
});

export const { addMessage, removeMessage } = notificationsSlice.actions;

export default notificationsSlice.reducer;
