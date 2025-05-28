import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { register } from '../services/authService';
import { User, Mail, Lock, Eye, EyeOff, Key, CheckCircle, Phone, Calendar } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';

export default function Signup() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, handleLoginSuccess } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    mobile_number: '',
    gender: 'male'
  });
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Redirect if user is already logged in
  useEffect(() => {
    if (user) {
      const from = location.state?.from?.pathname || '/';
      navigate(from, { replace: true });
    }
  }, [user, navigate, location]);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    const { email, password, first_name, last_name, mobile_number } = formData;
    
    if (!email || !password || !first_name || !last_name || !mobile_number) {
      return 'All fields are required.';
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return 'Please enter a valid email address.';
    }
    if (password.length < 8) {
      return 'Password must be at least 8 characters long.';
    }
    if (password !== confirmPassword) {
      return 'Passwords do not match.';
    }
    if (!/^\d{10,15}$/.test(mobile_number)) {
      return 'Please enter a valid mobile number (10-15 digits).';
    }
    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);
    
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      setIsLoading(false);
      return;
    }
    
    try {
      console.log('Sending signup request with data:', formData);
      
      const result = await register(formData);
      
      if (result && result.token) {
        // If auto-login was successful, redirect to dashboard
        console.log('Registration and auto-login successful, redirecting...');
        navigate('/', { replace: true });
      } else {
        // If auto-login didn't happen, show success message and redirect to login
        setSuccess('Registration successful! Redirecting to login...');
        setTimeout(() => navigate('/login', { state: { from: '/' } }), 1500);
      }
    } catch (err) {
      console.error('Signup error:', err);
      // Handle different types of errors
      if (err.response) {
        // Server responded with an error status
        setError(err.response.data?.detail || 'Registration failed. Please try again.');
      } else if (err.request) {
        // Request was made but no response received
        setError('Unable to connect to the server. Please check your connection.');
      } else {
        // Something else happened
        setError(err.message || 'Registration failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Google login success
  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      setIsLoading(true);
      setError('');
      
      // Decode the JWT token to get user info
      const decodedToken = JSON.parse(atob(credentialResponse.credential.split('.')[1]));
      
      // Create user data from Google response
      const userData = {
        email: decodedToken.email,
        first_name: decodedToken.given_name || decodedToken.name.split(' ')[0],
        last_name: decodedToken.family_name || decodedToken.name.split(' ').slice(1).join(' '),
        password: null, // No password for Google login
        mobile_number: '', // Optional field
        gender: 'neutral', // Default gender
        google_id: decodedToken.sub // Add google_id from the token
      };

      // Call the register function with Google user data
      const result = await register(userData);
      
      if (result && result.token) {
        // If registration and auto-login was successful
        handleLoginSuccess(credentialResponse);
        navigate('/', { replace: true });
      } else {
        setSuccess('Registration successful! Redirecting to login...');
        setTimeout(() => navigate('/login', { state: { from: '/' } }), 1500);
      }
    } catch (err) {
      console.error('Google signup error:', err);
      setError(err.message || 'Failed to sign up with Google. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleError = () => {
    setError('Google sign up failed. Please try again.');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-white to-purple-200 flex items-center justify-center p-4">
      <div className="relative bg-white rounded-xl shadow-xl p-8 max-w-sm w-full">
        {/* Background elements - simplified representation */}
        <div className="absolute -top-12 -left-16 w-32 h-32 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob"></div>
        <div className="absolute -bottom-8 -right-12 w-32 h-32 bg-purple-400 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-2000"></div>

        <div className="flex justify-center mb-6">
          {/* Placeholder for illustration - A simple checklist icon for now */}
          <div className="bg-purple-500 text-white p-3 rounded-full">
             <CheckCircle size={30} />
          </div>
        </div>

        <h2 className="text-3xl font-bold text-center text-gray-800 mb-6">Sign up</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="first_name" className="sr-only">First Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  id="first_name"
                  name="first_name"
                  type="text"
                  placeholder="First Name"
                  value={formData.first_name}
                  onChange={handleChange}
                  required
                  disabled={isLoading}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                  autoComplete="given-name"
                />
              </div>
            </div>
            <div>
              <label htmlFor="last_name" className="sr-only">Last Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  id="last_name"
                  name="last_name"
                  type="text"
                  placeholder="Last Name"
                  value={formData.last_name}
                  onChange={handleChange}
                  required
                  disabled={isLoading}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                  autoComplete="family-name"
                />
              </div>
            </div>
          </div>

          <div>
            <label htmlFor="email" className="sr-only">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                id="email"
                name="email"
                type="email"
                placeholder="Email Address"
                value={formData.email}
                onChange={handleChange}
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
                name="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Password (min 8 characters)"
                value={formData.password}
                onChange={handleChange}
                required
                disabled={isLoading}
                className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                autoComplete="new-password"
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

          <div>
            <label htmlFor="confirmPassword" className="sr-only">Confirm Password</label>
            <div className="relative">
               <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Confirm Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={isLoading}
                className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-purple-500 focus:focus:border-purple-500"
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
              >
                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="mobile_number" className="sr-only">Mobile Number</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                id="mobile_number"
                name="mobile_number"
                type="tel"
                placeholder="Mobile Number (10-15 digits)"
                value={formData.mobile_number}
                onChange={handleChange}
                required
                disabled={isLoading}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                autoComplete="tel"
              />
            </div>
          </div>

          <div>
            <label htmlFor="gender" className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
            <div className="relative">
               <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 z-10" size={20} />
              <select
                id="gender"
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                required
                disabled={isLoading}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-purple-500 focus:border-purple-500 appearance-none bg-white"
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="neutral">Prefer not to say</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.172l-4.243-4.243L4.343 8z" /></svg>
              </div>
            </div>
          </div>

          {error && (
             <div className="rounded-md bg-red-100 border border-red-400 p-3">
               <div className="text-sm text-red-700 text-center">{error}</div>
             </div>
           )}
           
           {success && (
             <div className="rounded-md bg-green-100 border border-green-400 p-3">
               <div className="text-sm text-green-700 text-center">{success}</div>
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
                   Creating Account...
                 </span>
               ) : 'Create Account'}
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
            text="signup_with"
            size="large"
          />
        </div>

        <div className="mt-6 text-center text-sm">
          <p className="text-gray-600">Already have an account? <Link to="/login" className="text-purple-600 hover:text-purple-800 font-bold">Log in</Link></p>
        </div>

         {/* Basic animation styles */}
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
}
