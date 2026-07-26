import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
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
  const attemptedPath = location.state?.from?.pathname;
  const sessionMessage = location.state?.sessionExpired
    ? 'Your session expired. Please sign in again.'
    : '';

  const from =
    attemptedPath && attemptedPath !== '/onboarding'
      ? attemptedPath
      : '/dashboard';

  const validate = () => {
    const newErrors = {};
    if (!formData.email.includes('@')) newErrors.email = 'Please enter a valid email address';
    if (formData.password.length < 6) newErrors.password = 'Password must be at least 6 characters long';
    return newErrors;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    setErrors((prev) => ({
      ...prev,
      [name]: '',
    }));

    if (serverError) {
      setServerError('');
    }
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

      const user = data.data || data.user;
      const token = data.accessToken || data.token;

      if (!user || !token) {
        throw new Error('Invalid login response from server');
      }

      login(user, token);

      navigate(from, { replace: true });
    } catch (err) {
      setServerError(
        err.response?.data?.message ||
        err.message ||
        'Login failed. Please check your credentials.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setServerError('');
    setLoading(true);

    try {
      const { data } = await api.post('/auth/google', {
        credential: credentialResponse.credential,
      });

      const user = data.data || data.user;
      const token = data.accessToken || data.token;

      if (!user || !token) {
        throw new Error('Invalid Google login response from server');
      }

      login(user, token);

      navigate(from, { replace: true });
    } catch (err) {
      setServerError(
        err.response?.data?.message ||
        err.message ||
        'Google login failed. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleError = () => {
    setServerError('Google login failed. Please try again.');
  };

  return (
    <div className="min-h-screen bg-cream flex flex-col justify-center items-center px-4 font-sans text-ink py-12">
      <div className="w-full max-w-md bg-white p-8 rounded-lg shadow-sm border border-stone-100">
        <h2 className="font-serif text-3xl text-center mb-2">Ink & Key</h2>
        <p className="text-center text-sm text-stone-500 mb-8">Welcome back to your reading community</p>

        {(serverError || sessionMessage) && (
          <div className="bg-red-50 text-red-600 text-sm p-3 rounded mb-4 text-center">
            {serverError || sessionMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label
              htmlFor="email"
              className="block text-xs uppercase tracking-wider text-stone-500 mb-1"
            >
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              className={`w-full p-3 bg-cream border ${errors.email ? 'border-red-300' : 'border-stone-200'
                } rounded focus:outline-none focus:border-accent transition`}
              value={formData.email}
              onChange={handleChange}
            />
            {errors.email && <span className="text-xs text-red-500 mt-1 block">{errors.email}</span>}
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-xs uppercase tracking-wider text-stone-500 mb-1"
            >
              Password
            </label>

            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className={`w-full p-3 bg-cream border ${errors.password ? 'border-red-300' : 'border-stone-200'
                } rounded focus:outline-none focus:border-accent transition`}
              value={formData.password}
              onChange={handleChange}
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
          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-stone-200" />
            <span className="text-xs uppercase tracking-wider text-stone-400">or</span>
            <div className="h-px flex-1 bg-stone-200" />
          </div>

          <div className="flex justify-center">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleError}
              text="signin_with"
              theme="outline"
              shape="pill"
              size="large"
              logo_alignment="left"
              width="352"
            />
          </div>
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
