import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { register } from '../services/authService';

export default function Signup() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    mobile_number: '',
    gender: 'male'
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Redirect if user is already logged in
  useEffect(() => {
    if (user) {
      const from = location.state?.from?.pathname || '/';
      navigate(from, { replace: true });
    }
  }, [user, navigate]);
  
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-gray-800 p-8 rounded-lg shadow-lg">
        <div>
          <h2 className="text-center text-3xl font-extrabold text-white">Create your account</h2>
          <p className="mt-2 text-center text-sm text-gray-400">
            Or{' '}
            <button
              onClick={() => navigate('/login')}
              className="font-medium text-blue-400 hover:text-blue-300 focus:outline-none"
            >
              sign in to your account
            </button>
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="first-name" className="sr-only">First Name</label>
                <input
                  id="first-name"
                  name="first_name"
                  type="text"
                  autoComplete="given-name"
                  required
                  className="appearance-none relative block w-full px-3 py-2 border border-gray-700 bg-gray-700 text-white placeholder-gray-500 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="First name"
                  value={formData.first_name}
                  onChange={handleChange}
                  disabled={isLoading}
                />
              </div>
              <div>
                <label htmlFor="last-name" className="sr-only">Last Name</label>
                <input
                  id="last-name"
                  name="last_name"
                  type="text"
                  autoComplete="family-name"
                  required
                  className="appearance-none relative block w-full px-3 py-2 border border-gray-700 bg-gray-700 text-white placeholder-gray-500 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="Last name"
                  value={formData.last_name}
                  onChange={handleChange}
                  disabled={isLoading}
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="email-address" className="sr-only">Email address</label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none relative block w-full px-3 py-2 border border-gray-700 bg-gray-700 text-white placeholder-gray-500 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Email address"
                value={formData.email}
                onChange={handleChange}
                disabled={isLoading}
              />
            </div>
            
            <div>
              <label htmlFor="password" className="sr-only">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                className="appearance-none relative block w-full px-3 py-2 border border-gray-700 bg-gray-700 text-white placeholder-gray-500 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Password (min 8 characters)"
                value={formData.password}
                onChange={handleChange}
                disabled={isLoading}
              />
            </div>
            
            <div>
              <label htmlFor="mobile-number" className="sr-only">Mobile Number</label>
              <input
                id="mobile-number"
                name="mobile_number"
                type="tel"
                autoComplete="tel"
                required
                className="appearance-none relative block w-full px-3 py-2 border border-gray-700 bg-gray-700 text-white placeholder-gray-500 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Mobile Number (10-15 digits)"
                value={formData.mobile_number}
                onChange={handleChange}
                disabled={isLoading}
              />
            </div>
            
            <div>
              <label htmlFor="gender" className="block text-sm font-medium text-gray-300 mb-1">
                Gender
              </label>
              <select
                id="gender"
                name="gender"
                className="appearance-none relative block w-full px-3 py-2 border border-gray-700 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                value={formData.gender}
                onChange={handleChange}
                disabled={isLoading}
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="neutral">Prefer not to say</option>
              </select>
            </div>
          </div>

          {error && (
            <div className="rounded-md bg-red-900/50 border border-red-700 p-4">
              <div className="text-sm text-red-200">{error}</div>
            </div>
          )}
          
          {success && (
            <div className="rounded-md bg-green-900/50 border border-green-700 p-4">
              <div className="text-sm text-green-200">{success}</div>
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
                  Creating Account...
                </span>
              ) : 'Create Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
