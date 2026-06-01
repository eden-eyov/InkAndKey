import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store/store';
import { AuthProvider } from './context/AuthContext';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
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
  </React.StrictMode>
);