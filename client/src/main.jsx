import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store/store';
import { AuthProvider } from './context/AuthContext';
import { GoogleOAuthProvider } from '@react-oauth/google';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
    {/* BrowserRouter must be outermost - enables routing everywhere */}
    <BrowserRouter>
      {/* Provider (Redux) wraps the app - global store access */}
      <Provider store={store}>
        {/* AuthProvider (Context) wraps App - global auth state */}
        <AuthProvider>
          <App />
        </AuthProvider>
      </Provider>
    </BrowserRouter>
    </GoogleOAuthProvider>
  </React.StrictMode>
);