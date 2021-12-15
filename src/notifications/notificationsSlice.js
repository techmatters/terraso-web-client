import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  messages: {}
}

const notificationsSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    addMessage: (state, action) => ({
      ...state,
      messages: {
        ...state.messages,
        [action.payload.key]: action.payload.message
      }
    })
  },
  extraReducers: {}
})

export const {
  addMessage
} = notificationsSlice.actions

export default notificationsSlice.reducer
