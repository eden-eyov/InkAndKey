import { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';

import Navbar from './components/Navbar';
import PrivateRoute from './components/PrivateRoute';

// Public pages
const HomePage = lazy(() => import('./pages/HomePage'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));

// Guest-friendly pages
const DiscoverClubs = lazy(() => import('./pages/DiscoverClubs'));
const Club = lazy(() => import('./pages/Club'));

// Protected pages
const Onboarding = lazy(() => import('./pages/Onboarding'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Profile = lazy(() => import('./pages/Profile'));

// Error page
const NotFound = lazy(() => import('./pages/NotFound'));

// Typography-based loading fallback
const LoadingFallback = () => (
  <div className="min-h-screen bg-cream flex justify-center items-center">
    <p className="font-serif text-stone-500 italic text-xl">Loading...</p>
  </div>
);

function App() {
  return (
    <>
      <Navbar />

      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Guest-friendly routes */}
          <Route path="/clubs" element={<DiscoverClubs />} />
          <Route path="/clubs/:clubId" element={<Club />} />

          {/* Protected routes */}
          <Route
            path="/onboarding"
            element={
              <PrivateRoute>
                <Onboarding />
              </PrivateRoute>
            }
          />

          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            }
          />

          <Route
            path="/profile"
            element={
              <PrivateRoute>
                <Profile />
              </PrivateRoute>
            }
          />
          <Route
            path="/profile/:userId"
            element={
              <PrivateRoute>
                <Profile />
              </PrivateRoute>
            }
          />

          {/* Catch-all route for unmatched URLs */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </>
  );
}

export default App;