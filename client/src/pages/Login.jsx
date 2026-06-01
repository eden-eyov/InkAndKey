import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

function Login() {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  // Smart redirect: check if the user tried to visit a protected page before logging in
  const from = location.state?.from?.pathname || '/dashboard';

  const validate = () => {
    const newErrors = {};
    if (!formData.email.includes('@')) newErrors.email = 'Please enter a valid email address';
    if (formData.password.length < 6) newErrors.password = 'Password must be at least 6 characters long';
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');
    
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    
    setErrors({});
    setLoading(true);
    
    try {
      const { data } = await api.post('/auth/login', formData);
      
      // Update the global authentication state
      login(data.user, data.token); 
      
      // Navigate to the intended page, or dashboard by default
      navigate(from, { replace: true });
      
    } catch (err) {
      setServerError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream flex flex-col justify-center items-center px-4 font-sans text-ink py-12">
      <div className="w-full max-w-md bg-white p-8 rounded-lg shadow-sm border border-stone-100">
        <h2 className="font-serif text-3xl text-center mb-2">Ink & Key</h2>
        <p className="text-center text-sm text-stone-500 mb-8">Welcome back to your reading community</p>
        
        {serverError && (
          <div className="bg-red-50 text-red-600 text-sm p-3 rounded mb-4 text-center">
            {serverError}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs uppercase tracking-wider text-stone-500 mb-1">Email</label>
            <input 
              type="email"
              className={`w-full p-3 bg-cream border ${errors.email ? 'border-red-300' : 'border-stone-200'} rounded focus:outline-none focus:border-accent transition`}
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
            />
            {errors.email && <span className="text-xs text-red-500 mt-1 block">{errors.email}</span>}
          </div>
          
          <div>
            <label className="block text-xs uppercase tracking-wider text-stone-500 mb-1">Password</label>
            <input 
              type="password"
              className={`w-full p-3 bg-cream border ${errors.password ? 'border-red-300' : 'border-stone-200'} rounded focus:outline-none focus:border-accent transition`}
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
            />
            {errors.password && <span className="text-xs text-red-500 mt-1 block">{errors.password}</span>}
          </div>
          
          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-3 bg-ink text-white font-medium rounded hover:opacity-90 transition disabled:opacity-50 mt-2"
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
        
        <p className="text-center text-sm text-stone-500 mt-6">
          Don't have an account yet?{' '}
          <Link to="/register" className="text-accent font-medium hover:underline">Join here</Link>
        </p>
      </div>
    </div>
  );
}

export default Login;