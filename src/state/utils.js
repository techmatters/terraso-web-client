import { createAsyncThunk as createAsyncThunkBase } from '@reduxjs/toolkit'
import { addMessage } from 'notifications/notificationsSlice'

// Handle custom error message to allow multiple sub messages
export const createAsyncThunk = (name, action, onSuccessMessage, onErrorMessage) => createAsyncThunkBase(
  name,
  async (input, thunkAPI) => {
    const { rejectWithValue, dispatch } = thunkAPI
    try {
      const result = await action(input, thunkAPI)
      if (onSuccessMessage) {
        dispatch(addMessage(onSuccessMessage(result)))
      }
      return result
    } catch (error) {
      if (onErrorMessage) {
        dispatch(addMessage(onErrorMessage(error)))
      }
      return rejectWithValue(error)
    }
  }
)
