import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  // Show a blank screen (or a loading spinner) while checking authentication status
  if (loading) {
    return (
      <div className="min-h-screen bg-cream flex justify-center items-center">
        <p className="text-stone-500 font-medium text-sm">Verifying session...</p>
      </div>
    );
  }

  // If there is no user, redirect to the login page.
  // The 'state={{ from: location }}' trick saves where they TRIED to go,
  // so we can send them back there after a successful login!
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If user is authenticated, render the protected component (like Dashboard)
  return children;
}

export default PrivateRoute;