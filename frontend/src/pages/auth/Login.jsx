import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Lock, User, Eye, EyeOff, Key } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { GoogleLogin } from '@react-oauth/google';
import { Box, Button, FormControl, FormLabel, Input, InputGroup, InputRightElement, Checkbox, Text, VStack, useToast } from '@chakra-ui/react';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const { login, isAuthenticated } = useAuth();
  
  // For backward compatibility with existing code
  const contextLogin = useCallback(async (credentials) => {
    try {
      await login(credentials);
      return true;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }, [login]);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      const from = location.state?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, location]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      console.log('Attempting login for:', email);
      
      // Call the backend login endpoint using the context login
      const response = await fetch('http://localhost:5001/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          username: email,
          password: password
        })
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.detail || 'Login failed. Please check your credentials.');
      }

      // Store tokens and user data
      const { access_token, refresh_token, user: userData } = responseData;
      
      // Store tokens in localStorage
      localStorage.setItem('token', access_token);
      if (refresh_token) {
        localStorage.setItem('refresh_token', refresh_token);
      }
      
      if (userData) {
        // Ensure user data has required fields
        const userWithRequiredFields = {
          ...userData,
          id: userData.id || userData.userId || userData.user_id || 'unknown',
          email: userData.email || email,
          name: userData.first_name || userData.name || email.split('@')[0] || 'User',
          first_name: userData.first_name || userData.name || email.split('@')[0] || 'User',
          picture: userData.picture || userData.profile_picture || 
            `https://ui-avatars.com/api/?name=${encodeURIComponent(
              userData.first_name || userData.name || email.split('@')[0] || 'U'
            )}&background=random`
        };
        
        // Store user data in localStorage
        localStorage.setItem('user', JSON.stringify(userWithRequiredFields));
        
        // Update auth context
        contextLogin({
          ...userWithRequiredFields,
          access_token,
          refresh_token
        });
        
        // Show success message
        toast({
          title: 'Login successful',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        
        // Navigate to dashboard or previous location
        const from = location.state?.from?.pathname || '/dashboard';
        navigate(from, { replace: true });
      } else {
        throw new Error('Invalid user data received from server');
      }
      
    } catch (err) {
      console.error('Login error:', err);
      setError(err.message || 'Login failed. Please try again.');
      
      // Show error toast
      toast({
        title: 'Login failed',
        description: err.message || 'Please check your credentials and try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setError('');
    setIsLoading(true);
    
    try {
      console.log('Google OAuth response:', credentialResponse);
      
      if (!credentialResponse.credential) {
        throw new Error('No credential received from Google');
      }
      
      // The backend only expects the credential field
      const requestBody = {
        credential: credentialResponse.credential
      };

      console.log('Sending Google auth request to backend:', requestBody);

      // Send the token to your backend for verification
      const response = await fetch('http://localhost:5001/auth/google', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(requestBody),
        credentials: 'include'
      });

      const responseData = await response.json();
      console.log('Backend response:', response, responseData);

      if (!response.ok) {
        // If the response is a 422 (Unprocessable Entity), log the validation errors
        if (response.status === 422 && responseData.detail) {
          console.error('Validation error:', responseData.detail);
          throw new Error(`Validation error: ${responseData.detail.map(e => `${e.loc.join('.')}: ${e.msg}`).join(', ')}`);
        }
        // For other error statuses, throw with the error message from the backend
        const errorMessage = responseData.detail || 'Authentication failed';
        throw new Error(errorMessage);
      }

      // The backend returns access_token and refresh_token
      const { access_token, refresh_token, user: userData } = responseData;
      
      if (!access_token) {
        throw new Error('No access token received from server');
      }

      // Store tokens in localStorage
      localStorage.setItem('token', access_token);
      if (refresh_token) {
        localStorage.setItem('refresh_token', refresh_token);
      }
      
      let userProfile = userData;
      
      // If user data is not in the initial response, fetch it from the /me endpoint
      if (!userProfile) {
        try {
          const userResponse = await fetch('http://localhost:5001/auth/me', {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${access_token}`,
              'Accept': 'application/json',
            },
          });
          
          if (userResponse.ok) {
            const userData = await userResponse.json();
            userProfile = userData;
          } else {
            console.warn('Failed to fetch user profile, using minimal user data');
            // If we can't get the user profile, create a minimal user object
            // The email will be extracted from the ID token later
            userProfile = {};
          }
        } catch (err) {
          console.warn('Error fetching user profile:', err);
          userProfile = {};
        }
      }

      // Extract email from the ID token if available
      let email = userProfile.email;
      if (!email && credentialResponse.credential) {
        try {
          const payload = JSON.parse(atob(credentialResponse.credential.split('.')[1]));
          email = payload.email || payload.sub;
        } catch (e) {
          console.warn('Could not extract email from ID token:', e);
        }
      }

      // Ensure user data has required fields
      const userWithRequiredFields = {
        ...userProfile,
        id: userProfile.id || userProfile.userId || userProfile.user_id || 'unknown',
        email: email || 'unknown@example.com',
        name: userProfile.first_name || userProfile.name || email?.split('@')[0] || 'User',
        first_name: userProfile.first_name || userProfile.name || email?.split('@')[0] || 'User',
        picture: userProfile.picture || userProfile.profile_picture || 
          `https://ui-avatars.com/api/?name=${encodeURIComponent(
            userProfile.first_name || userProfile.name || email?.split('@')[0] || 'U'
          )}&background=random`
      };

      // Store user data in localStorage
      localStorage.setItem('user', JSON.stringify(userWithRequiredFields));
      
      // Update auth context
      contextLogin({
        ...userWithRequiredFields,
        access_token,
        refresh_token
      });
      
      // Show success message
      toast({
        title: 'Login successful',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      // Navigate to dashboard or previous location
      const from = location.state?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
    } catch (err) {
      console.error('Google login error:', err);
      setError(err.message || 'Failed to authenticate with Google');
      
      // Show error toast
      toast({
        title: 'Google login failed',
        description: err.message || 'Failed to authenticate with Google. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleError = (error) => {
    console.error('Google authentication error:', error);
    setError('Google authentication failed. Please try again.');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-white to-purple-200 flex items-center justify-center p-4">
      {/* Top Navigation Bar */}
      <nav className="fixed top-0 left-0 right-0 bg-white bg-opacity-80 backdrop-filter backdrop-blur-lg shadow-md z-50 p-4 flex items-center justify-between">
        {/* App Title */}
        <div className="text-lg font-bold text-purple-700">
          Chanakya AI Wellness Companion
        </div>

        {/* Navigation Links */}
        <div className="flex items-center space-x-4">
          <Link to="/" className="text-gray-600 hover:text-purple-700 transition-colors">
            Home
          </Link>
          <Link to="/contact" className="text-gray-600 hover:text-purple-700 transition-colors">
            Contact
          </Link>
          <Link to="/signup" className="text-gray-600 hover:text-purple-700 transition-colors">
            Sign Up
          </Link>
        </div>
      </nav>

      <div className="relative bg-white rounded-xl shadow-xl p-8 max-w-sm w-full">
        {/* Background elements */}
        <div className="absolute -top-12 -left-16 w-32 h-32 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob"></div>
        <div className="absolute -bottom-8 -right-12 w-32 h-32 bg-purple-400 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-2000"></div>

        <div className="flex justify-center mb-6">
          <div className="bg-purple-500 text-white p-3 rounded-full">
             <Lock size={30} />
          </div>
        </div>

        <h2 className="text-3xl font-bold text-center text-gray-800 mb-6">Log in</h2>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label htmlFor="email" className="sr-only">Email Address</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                id="email"
                type="email"
                placeholder="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                autoComplete="email"
              />
            </div>
          </div>
          
          <div>
            <label htmlFor="password" className="sr-only">Password</label>
            <div className="relative">
               <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
                className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center">
              <input
                id="rememberMe"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                disabled={isLoading}
                className="h-4 w-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
              />
              <label htmlFor="rememberMe" className="ml-2 text-gray-600">Remember me</label>
            </div>
            <button 
              onClick={() => alert('Forgot password functionality coming soon!')}
              className="text-purple-600 hover:text-purple-800 text-sm"
            >
              Forgot Password?
            </button>
          </div>

           {error && (
             <div className="rounded-md bg-red-100 border border-red-400 p-3 text-center">
               <div className="text-sm text-red-700">{error}</div>
             </div>
           )}

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50 ${isLoading ? 'opacity-75 cursor-not-allowed' : ''}`}
          >
             {isLoading ? (
                 <span className="flex items-center justify-center">
                   <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                     <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                     <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                   </svg>
                   Logging in...
                 </span>
               ) : 'Log in'}
          </button>
        </form>

        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">Or continue with</span>
          </div>
        </div>

        <div className="flex justify-center">
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={handleGoogleError}
            useOneTap
            theme="filled_blue"
            shape="rectangular"
            text="signin_with"
            size="large"
          />
        </div>

        <div className="mt-6 text-center text-sm">
          <p className="text-gray-600">Don't have an account? <Link to="/signup" className="text-purple-600 hover:text-purple-800 font-bold">Sign up</Link></p>
        </div>

        {/* Animation styles */}
        <style>{`
          @keyframes blob {
            0% {
              transform: translate(0px, 0px) scale(1);
            }
            33% {
              transform: translate(30px, -40px) scale(1.1);
            }
            66% {
              transform: translate(-20px, 20px) scale(0.9);
            }
            100% {
              transform: translate(0px, 0px) scale(1);
            }
          }
          .animate-blob {
            animation: blob 7s infinite;
          }
          .animation-delay-2000 {
            animation-delay: 2s;
          }
        `}</style>
      </div>
    </div>
  );
};

export default Login;
