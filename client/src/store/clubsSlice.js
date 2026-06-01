import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import api from '../services/api';

// SERVER TODO:
// This should call a protected backend endpoint that returns only the clubs
// joined by the logged-in user.
// Possible endpoint: GET /clubs/my-clubs
export const fetchUserClubs = createAsyncThunk(
  'clubs/fetchUserClubs',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get('/clubs/my-clubs');

      // Supports both response structures:
      // { data: clubs } or { clubs: clubs }
      return data.data || data.clubs || [];
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || 'Failed to load your book clubs.'
      );
    }
  }
);

// SERVER TODO:
// Later, this can fetch all public/discoverable clubs for the DiscoverClubs page.
// Possible endpoint: GET /clubs
export const fetchAllClubs = createAsyncThunk(
  'clubs/fetchAllClubs',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get('/clubs');

      return data.data || data.clubs || [];
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || 'Failed to load book clubs.'
      );
    }
  }
);

const clubsSlice = createSlice({
  name: 'clubs',

  initialState: {
    list: [],
    selectedClub: null,
    loading: false,
    error: null,
  },

  reducers: {
    clearClubs: (state) => {
      state.list = [];
      state.error = null;
    },

    clearSelectedClub: (state) => {
      state.selectedClub = null;
    },
  },

  extraReducers: (builder) => {
    builder
      // fetchUserClubs
      .addCase(fetchUserClubs.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserClubs.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload;
      })
      .addCase(fetchUserClubs.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // fetchAllClubs
      .addCase(fetchAllClubs.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllClubs.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload;
      })
      .addCase(fetchAllClubs.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearClubs, clearSelectedClub } = clubsSlice.actions;

export default clubsSlice.reducer;