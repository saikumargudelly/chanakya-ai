import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import ResetPasswordModal from './ResetPasswordModal';
import { useAuth } from './AuthContext';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, user } = useAuth();
  const [showReset, setShowReset] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Redirect if user is already logged in
  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  // Check for error in URL parameters
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const errorParam = params.get('error');
    if (errorParam === 'session_expired') {
      setError('Your session has expired. Please log in again.');
    }
  }, [location]);

  const handleSubmit = async (e) => {
    console.log('Login button clicked');
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      console.log('Login form submitted with email:', email);
      
      // Prepare form data for URL-encoded format
      const formData = new URLSearchParams();
      formData.append('username', email); // OAuth2 expects 'username', even if it's an email
      formData.append('password', password);
      formData.append('grant_type', 'password');
      
      console.log('Sending login request to /auth/token');
      
      // Make the login request with proper headers
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5001'}/auth/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
        },
        credentials: 'include',
        mode: 'cors',
        body: formData.toString(),
      });
      
      const data = await response.json();
      console.log('Login response:', data);
      
      if (!response.ok) {
        throw new Error(data.detail || 'Login failed. Please check your credentials.');
      }
      
      if (data.access_token) {
        // Store the token
        localStorage.setItem('token', data.access_token);
        
        // Call the login function from AuthContext to update the auth state
        const loginSuccess = await login(email, password);
        
        if (loginSuccess) {
          console.log('Login successful, redirecting to dashboard...');
          navigate('/dashboard', { replace: true });
        } else {
          throw new Error('Failed to initialize user session.');
        }
      } else {
        throw new Error('No access token received from server');
      }
    } catch (err) {
      console.error('Login error:', err);
      // Handle different types of errors
      if (err.response) {
        setError(err.response.data?.detail || 'Login failed. Please try again.');
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Login failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-gray-800 p-8 rounded-lg shadow-lg">
        <div>
          <h2 className="text-center text-3xl font-extrabold text-white">Sign in to your account</h2>
          <p className="mt-2 text-center text-sm text-gray-400">
            Or{' '}
            <button
              onClick={() => navigate('/signup')}
              className="font-medium text-blue-400 hover:text-blue-300 focus:outline-none"
            >
              create a new account
            </button>
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email-address" className="sr-only">Email address</label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-700 bg-gray-700 text-white placeholder-gray-500 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Email address"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-700 bg-gray-700 text-white placeholder-gray-500 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Password"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <button
                type="button"
                className="text-sm text-blue-400 hover:text-blue-300"
                onClick={() => setShowReset(true)}
              >
                Forgot your password?
              </button>
            </div>
          </div>

          {error && (
            <div className="rounded-md bg-red-900/50 border border-red-700 p-4">
              <div className="text-sm text-red-200">{error}</div>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className={`group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${isLoading ? 'opacity-75 cursor-not-allowed' : ''}`}
            >
              {isLoading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Signing in...
                </span>
              ) : 'Sign in'}
            </button>
          </div>
        </form>
      </div>
      
      {showReset && (
        <ResetPasswordModal 
          isOpen={showReset} 
          onClose={() => {
            setShowReset(false);
            // Reset any error/loading states when closing
            setError('');
            setIsLoading(false);
          }} 
        />
      )}
    </div>
  );
}
