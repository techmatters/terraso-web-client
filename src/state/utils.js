import { createAsyncThunk as createAsyncThunkBase } from '@reduxjs/toolkit';

// Handle custom error message to allow multiple sub messages
export const createAsyncThunk = (name, action) => createAsyncThunkBase(
  name,
  async (input, thunkAPI) => {
    try {
      return await action(input);
    } catch (error) {
      return thunkAPI.rejectWithValue(error);
    }
  }
);
