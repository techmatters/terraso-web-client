import { createAsyncThunk as createAsyncThunkBase } from '@reduxjs/toolkit'

import { addMessage } from 'notifications/notificationsSlice'
import { signOut } from 'account/accountSlice'
import { UNAUTHENTICATED } from 'account/authConstants'

export const createAsyncThunk = (name, action, onSuccessMessage, customErrorMessage) => createAsyncThunkBase(
  name,
  async (input, thunkAPI) => {
    const { rejectWithValue, dispatch } = thunkAPI
    try {
      const result = await action(input, thunkAPI)
      if (onSuccessMessage) {
        dispatch(addMessage(onSuccessMessage(result, input)))
      }
      return result
    } catch (error) {
      // Handle auth error
      if (error === UNAUTHENTICATED) {
        dispatch(addMessage({ severity: 'error', content: 'account.unauthenticated_message' }))
        dispatch(signOut())
        return rejectWithValue(error)
      }

      // Handle custom error message to allow multiple sub messages
      const message = customErrorMessage
        ? customErrorMessage(error)
        : { severity: 'error', content: error }
      dispatch(addMessage(message))
      return rejectWithValue(error)
    }
  }
)
