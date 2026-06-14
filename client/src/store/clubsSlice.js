import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import api from '../services/api';

export const fetchUserClubs = createAsyncThunk(
  'clubs/fetchUserClubs',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get('/clubs/my-clubs');

      return data.data || data.clubs || data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || 'Failed to load clubs'
      );
    }
  }
);

export const fetchAllClubs = createAsyncThunk(
  'clubs/fetchAllClubs',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get('/clubs');

      return data.data || data.clubs || data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || 'Failed to load clubs'
      );
    }
  }
);

const clubsSlice = createSlice({
  name: 'clubs',
  initialState: {
    list: [],
    loading: false,
    error: null,
  },
  reducers: {
    clearClubs: (state) => {
      state.list = [];
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // My clubs / Dashboard
      .addCase(fetchUserClubs.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserClubs.fulfilled, (state, action) => {
        state.loading = false;
        state.list = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(fetchUserClubs.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // All public clubs / DiscoverClubs
      .addCase(fetchAllClubs.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllClubs.fulfilled, (state, action) => {
        state.loading = false;
        state.list = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(fetchAllClubs.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearClubs } = clubsSlice.actions;

export default clubsSlice.reducer;