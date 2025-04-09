import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSignInEmailPassword, useAccessToken, useAuthenticationStatus } from '@nhost/react';
import toast from 'react-hot-toast';
import authService from '../services/authService';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const { signInEmailPassword, isLoading, isSuccess, needsEmailVerification, error } = useSignInEmailPassword();
  const { isAuthenticated } = useAuthenticationStatus();
  const accessToken = useAccessToken();
  const navigate = useNavigate();

  // Handle successful login and store token
  useEffect(() => {
    if (isSuccess && isAuthenticated && accessToken) {
      // Use authService to store the token
      authService.storeToken(accessToken);
      
      // Log auth status for debugging
      authService.logAuthStatus();
      
      toast.success('Successfully logged in!');
      navigate('/');
    }
  }, [isSuccess, isAuthenticated, accessToken, navigate]);

  // Handle error states
  useEffect(() => {
    if (error) {
      if (error.message.includes('Invalid email or password')) {
        toast.error('Invalid email or password');
      } else if (error.message.includes('Email not verified')) {
        toast.error('Please verify your email before logging in');
      } else {
        toast.error(error.message);
      }
    }
  }, [error]);

  // Handle email verification
  useEffect(() => {
    if (needsEmailVerification) {
      toast.success('Please check your email to verify your account');
    }
  }, [needsEmailVerification]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      // Pass only the required arguments for the signInEmailPassword function
      await signInEmailPassword(email, password);
      
      // The JWT token will be handled in the useEffect hook after successful login
    } catch (err) {
      toast.error('An unexpected error occurred');
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-md">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Or{' '}
            <Link to="/signup" className="font-medium text-primary-600 hover:text-primary-500">
              create a new account
            </Link>
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email-address" className="sr-only">
                Email address
              </label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                Remember me
              </label>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                'Sign in'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login; 