import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Lock, User, Eye, EyeOff, Key } from 'lucide-react'; // Assuming lucide-react for icons
import { useAuth } from './AuthContext'; // Import useAuth
import { login as authLogin } from '../services/authService'; // Import login service

const Login = () => {
  const navigate = useNavigate(); // Use navigate hook
  const { user, login: contextLogin } = useAuth(); // Get login function from AuthContext
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(''); // State for error messages
  const [isLoading, setIsLoading] = useState(false); // State for loading indicator

  // Redirect if user is already logged in (Optional, based on previous logic)
  // useEffect(() => {
  //   if (user) {
  //     navigate('/');
  //   }
  // }, [user, navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      console.log('Attempting login for:', email);
      // Call the login service function
      const loginSuccess = await authLogin(email, password);

      if (loginSuccess) {
        console.log('Login successful, updating context and redirecting.');
        // Update auth context state
        await contextLogin(email, password); // Assuming contextLogin fetches user data after token is received
        navigate('/dashboard', { replace: true }); // Redirect to dashboard or desired page
      } else {
         // authService.login should throw an error on failure, but added check just in case
         throw new Error('Login failed. Please check your credentials.');
      }

    } catch (err) {
      console.error('Login error:', err);
      // Display specific error message if available, otherwise a generic one
      setError(err.response?.data?.detail || err.message || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
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
          {/* Assuming you have a /contact route */}
          <Link to="/contact" className="text-gray-600 hover:text-purple-700 transition-colors">
            Contact
          </Link>
          <Link to="/signup" className="text-gray-600 hover:text-purple-700 transition-colors">
            Sign Up
          </Link>
        </div>
      </nav>

      <div className="relative bg-white rounded-xl shadow-xl p-8 max-w-sm w-full">
        {/* Background elements - simplified representation */}
        <div className="absolute -top-12 -left-16 w-32 h-32 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob"></div>
        <div className="absolute -bottom-8 -right-12 w-32 h-32 bg-purple-400 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-2000"></div>

        <div className="flex justify-center mb-6">
          {/* Placeholder for illustration - A simple lock/key icon for now */}
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
                disabled={isLoading} // Disable input while loading
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-purple-500 focus:border-purple-500"
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
                disabled={isLoading} // Disable input while loading
                className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-purple-500 focus:border-purple-500"
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
                disabled={isLoading} // Disable input while loading
                className="h-4 w-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
              />
              <label htmlFor="rememberMe" className="ml-2 text-gray-600">Remember me</label>
            </div>
            <a href="#" className="text-purple-600 hover:text-purple-800 text-sm">Forgot Password?</a>
          </div>

           {error && (
             <div className="rounded-md bg-red-100 border border-red-400 p-3 text-center">
               <div className="text-sm text-red-700">{error}</div>
             </div>
           )}

          <button
            type="submit"
            disabled={isLoading} // Disable button while loading
            className={`w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50 ${isLoading ? 'opacity-75 cursor-not-allowed' : ''}`}
          >
             {isLoading ? (
                 <span className="flex items-center justify-center">
                   <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                     <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                     <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z\"></path>
                   </svg>
                   Logging in...
                 </span>
               ) : 'Log in'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm">
          <p className="text-gray-600">Don't have an account? <Link to="/signup" className="text-purple-600 hover:text-purple-800 font-bold">Sign up</Link></p>
        </div>

        {/* Basic animation styles */}
        <style jsx>{`
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
