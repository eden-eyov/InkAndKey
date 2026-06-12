import { Suspense, lazy } from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import Navbar from './components/Navbar';
import PrivateRoute from './components/PrivateRoute';

// Lazy-loaded pages for performance optimization
const HomePage = lazy(() => import('./pages/HomePage'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Onboarding = lazy(() => import('./pages/Onboarding'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const BookClubs = lazy(() => import('./pages/DiscoverClubs')); 
const ClubDetail = lazy(() => import('./pages/Club'));

// Typography-based loading fallback (clean, no icons)
const LoadingFallback = () => (
  <div className="min-h-screen bg-cream flex justify-center items-center">
    <p className="font-serif text-stone-500 italic text-xl">Loading...</p>
  </div>
);

// Typography-based 404 Not Found page
const NotFound = () => (
  <div className="min-h-screen bg-cream flex flex-col justify-center items-center px-4 font-sans text-ink">
    <h1 className="font-serif text-8xl mb-2 italic">404</h1>
    <p className="text-stone-500 mb-10 uppercase tracking-widest text-xs font-bold">Page not found</p>
    <Link 
      to="/" 
      className="px-8 py-3 border border-stone-200 text-ink text-xs font-bold uppercase tracking-wider rounded-full hover:border-accent hover:text-accent transition"
    >
      Return Home
    </Link>
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
          
          {/* Protected Routes (Require Authentication) */}
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
            path="/clubs" 
            element={
              <PrivateRoute>
                <BookClubs />
              </PrivateRoute>
            } 
          />
          <Route 
            path="/clubs/:id" 
            element={
              <PrivateRoute>
                <ClubDetail />
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