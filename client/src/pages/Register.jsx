import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

function Register() {
  const [formData, setFormData] = useState({ 
    name: '', 
    email: '', 
    password: '', 
    confirmPassword: '' 
  });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();
  const { login } = useAuth();

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Please enter your full name';
    if (!formData.email.includes('@')) newErrors.email = 'Please enter a valid email address';
    if (formData.password.length < 6) newErrors.password = 'Password must be at least 6 characters long';
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
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
    const { data } = await api.post('/auth/register', {
      username: formData.name,
      email: formData.email,
      password: formData.password,
    });

    const user = data.data || data.user;
    const token = data.accessToken || data.token;

    if (!user || !token) {
      throw new Error('Invalid register response from server');
    }

    login(user, token);
    navigate('/onboarding');
  } catch (err) {
    setServerError(
      err.response?.data?.message ||
        err.message ||
        'Registration failed. The email might already be in use.'
    );
  } finally {
    setLoading(false);
  }
  };

  return (
    <div className="min-h-screen bg-cream flex flex-col justify-center items-center px-4 font-sans text-ink py-12">
      <div className="w-full max-w-md bg-white p-8 rounded-lg shadow-sm border border-stone-100">
        <h2 className="font-serif text-3xl text-center mb-2">Ink & Key</h2>
        <p className="text-center text-sm text-stone-500 mb-8">Join our reading community</p>
        
        {serverError && (
          <div className="bg-red-50 text-red-600 text-sm p-3 rounded mb-4 text-center">
            {serverError}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs uppercase tracking-wider text-stone-500 mb-1">Username</label>
            <input 
              type="text"
              className={`w-full p-3 bg-cream border ${errors.name ? 'border-red-300' : 'border-stone-200'} rounded focus:outline-none focus:border-accent transition`}
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
            />
            {errors.name && <span className="text-xs text-red-500 mt-1 block">{errors.name}</span>}
          </div>

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

          <div>
            <label className="block text-xs uppercase tracking-wider text-stone-500 mb-1">Confirm Password</label>
            <input 
              type="password"
              className={`w-full p-3 bg-cream border ${errors.confirmPassword ? 'border-red-300' : 'border-stone-200'} rounded focus:outline-none focus:border-accent transition`}
              value={formData.confirmPassword}
              onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
            />
            {errors.confirmPassword && <span className="text-xs text-red-500 mt-1 block">{errors.confirmPassword}</span>}
          </div>
          
          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-3 bg-ink text-white font-medium rounded hover:opacity-90 transition disabled:opacity-50 mt-4"
          >
            {loading ? 'Creating account...' : 'Create account'}
          </button>
        </form>
        
        <p className="text-center text-sm text-stone-500 mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-accent font-medium hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}

export default Register;