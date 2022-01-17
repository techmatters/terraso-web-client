import { createAsyncThunk as createAsyncThunkBase } from '@reduxjs/toolkit'

import { addMessage } from 'notifications/notificationsSlice'
import { signOut } from 'account/accountSlice'
import { refreshToken } from 'account/auth'
import { UNAUTHENTICATED } from 'account/authConstants'

const executeAuthRequest = (dispatch, action) => action().catch(async error => {
  if (error !== UNAUTHENTICATED) {
    // If not auth error return request error
    await Promise.reject(error)
  }
  try {
    await refreshToken()
  } catch {
    // Failed token renew
    dispatch(signOut())
    await Promise.reject('account.unauthenticated_message')
  }
  // Retry request after tokens renewed
  return await action()
})

export const createAsyncThunk = (name, action, onSuccessMessage, customErrorMessage) => createAsyncThunkBase(
  name,
  async (input, thunkAPI) => {
    const { rejectWithValue, dispatch } = thunkAPI

    const executeAction = async () => {
      const result = await action(input, thunkAPI)
      if (onSuccessMessage) {
        dispatch(addMessage(onSuccessMessage(result, input)))
      }
      return result
    }

    try {
      return await executeAuthRequest(dispatch, executeAction)
    } catch (error) {
      const message = customErrorMessage
        ? customErrorMessage(error)
        : { severity: 'error', content: error }
      dispatch(addMessage(message))
      return rejectWithValue(error)
    }
  }
)
