import { createSlice } from '@reduxjs/toolkit';

const clubsSlice = createSlice({
  name: 'clubs',
  initialState: {
    items: [],
    loading: false,
  },
  reducers: {},
});

export default clubsSlice.reducer;