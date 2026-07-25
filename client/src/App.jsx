import { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import PrivateRoute from './components/PrivateRoute';

// Lazy-loaded pages for performance optimization
const HomePage = lazy(() => import('./pages/HomePage'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));

const DiscoverClubs = lazy(() => import('./pages/DiscoverClubs'));
const Club = lazy(() => import('./pages/Club'));
const ClubEditor = lazy(() => import('./pages/ClubEditor'));

const Onboarding = lazy(() => import('./pages/Onboarding'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Profile = lazy(() => import('./pages/Profile'));
const NotFound = lazy(() => import('./pages/NotFound'));

// Typography-based loading fallback (clean, no icons)
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
          {/* Public Routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Club Routes */}
          <Route path="/clubs" element={<DiscoverClubs />} />

          <Route
            path="/clubs/new"
            element={
              <PrivateRoute>
                <ClubEditor />
              </PrivateRoute>
            }
          />

          <Route path="/clubs/:id" element={<Club />} />

          <Route
            path="/clubs/:id/edit"
            element={
              <PrivateRoute>
                <ClubEditor />
              </PrivateRoute>
            }
          />

          {/* Protected Routes */}
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
            path="/users/:userId"
            element={
              <PrivateRoute>
                <Profile />
              </PrivateRoute>
            }
          />

          {/* 404 */}
          <Route path="/404" element={<NotFound />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </>
  );
}

export default App;