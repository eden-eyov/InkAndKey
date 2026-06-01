import { configureStore } from '@reduxjs/toolkit';
import clubsReducer from './clubsSlice'; 

export const store = configureStore({
  reducer: {
    clubs: clubsReducer, 
  },
});