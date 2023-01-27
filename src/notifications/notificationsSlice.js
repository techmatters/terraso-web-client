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
import _ from 'lodash/fp';
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

  extraReducers: () => {},
});

export const { addMessage, removeMessage } = notificationsSlice.actions;

export default notificationsSlice.reducer;
