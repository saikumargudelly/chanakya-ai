import React, { useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { register as registerUser } from '../../services/auth/authService';
import { User, Mail, Eye, EyeOff, Key, CheckCircle, Phone, Calendar } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useToast } from '@chakra-ui/react';

const signupSchema = yup.object().shape({
  first_name: yup.string().required('First name is required'),
  last_name: yup.string().required('Last name is required'),
  email: yup.string().email('Enter a valid email').required('Email is required'),
  password: yup.string().min(8, 'Password must be at least 8 characters').required('Password is required'),
  confirmPassword: yup.string().oneOf([yup.ref('password'), null], 'Passwords must match').required('Confirm your password'),
  mobile_number: yup.string().matches(/^\d{10,15}$/, 'Enter a valid mobile number (10-15 digits)').required('Mobile number is required'),
  gender: yup.string().required('Gender is required'),
});

export default function Signup() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, setUser, setIsAuthenticated, handleLoginSuccess } = useAuth();
  const toast = useToast();
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState('');

  const { register, handleSubmit, formState: { errors }, setError: setFormError, watch } = useForm({
    resolver: yupResolver(signupSchema),
    defaultValues: { gender: 'neutral' },
  });

  useEffect(() => {
    if (user) {
      const from = location.state?.from?.pathname || '/';
      navigate(from, { replace: true });
    }
  }, [user, navigate, location]);

  const onSubmit = async (data) => {
    setIsLoading(true);
    setError('');
    try {
      const { confirmPassword, ...formData } = data;
      const result = await registerUser(formData);
      if (result && result.token && result.user) {
        setUser(result.user);
        setIsAuthenticated(true);
        toast({ title: 'Registration successful', status: 'success', duration: 3000, isClosable: true });
        navigate('/dashboard', { replace: true });
      } else {
        setError('Registration successful but no token received. Please log in.');
        setTimeout(() => navigate('/login', { state: { from: '/' } }), 1500);
      }
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
      toast({
        title: 'Registration failed',
        description: err.message || 'Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      setFormError('email', { type: 'manual', message: err.message || 'Registration failed' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setIsLoading(true);
    setError('');
    try {
      await handleLoginSuccess(credentialResponse);
    } catch (err) {
      setError(err.message || 'Failed to sign in with Google. Please try again.');
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
        <div className="absolute -top-12 -left-16 w-32 h-32 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob"></div>
        <div className="absolute -bottom-8 -right-12 w-32 h-32 bg-purple-400 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-2000"></div>
        <div className="flex justify-center mb-6">
          <div className="bg-purple-500 text-white p-3 rounded-full"><CheckCircle size={30} /></div>
        </div>
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-6">Sign up</h2>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="first_name" className="sr-only">First Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  id="first_name"
                  {...register('first_name')}
                  type="text"
                  placeholder="First Name"
                  disabled={isLoading}
                  className={`w-full pl-10 pr-3 py-2 border ${errors.first_name ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-purple-500 focus:border-purple-500`}
                  autoComplete="given-name"
                />
              </div>
              {errors.first_name && <p className="text-red-600 text-xs mt-1">{errors.first_name.message}</p>}
            </div>
            <div>
              <label htmlFor="last_name" className="sr-only">Last Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  id="last_name"
                  {...register('last_name')}
                  type="text"
                  placeholder="Last Name"
                  disabled={isLoading}
                  className={`w-full pl-10 pr-3 py-2 border ${errors.last_name ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-purple-500 focus:border-purple-500`}
                  autoComplete="family-name"
                />
              </div>
              {errors.last_name && <p className="text-red-600 text-xs mt-1">{errors.last_name.message}</p>}
            </div>
          </div>
          <div>
            <label htmlFor="email" className="sr-only">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                id="email"
                {...register('email')}
                type="email"
                placeholder="Email Address"
                disabled={isLoading}
                className={`w-full pl-10 pr-3 py-2 border ${errors.email ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-purple-500 focus:border-purple-500`}
                autoComplete="email"
              />
            </div>
            {errors.email && <p className="text-red-600 text-xs mt-1">{errors.email.message}</p>}
          </div>
          <div>
            <label htmlFor="password" className="sr-only">Password</label>
            <div className="relative">
              <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                id="password"
                {...register('password')}
                type={showPassword ? 'text' : 'password'}
                placeholder="Password (min 8 characters)"
                disabled={isLoading}
                className={`w-full pl-10 pr-10 py-2 border ${errors.password ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-purple-500 focus:border-purple-500`}
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
            {errors.password && <p className="text-red-600 text-xs mt-1">{errors.password.message}</p>}
          </div>
          <div>
            <label htmlFor="confirmPassword" className="sr-only">Confirm Password</label>
            <div className="relative">
              <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                id="confirmPassword"
                {...register('confirmPassword')}
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Confirm Password"
                disabled={isLoading}
                className={`w-full pl-10 pr-10 py-2 border ${errors.confirmPassword ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-purple-500 focus:border-purple-500`}
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
            {errors.confirmPassword && <p className="text-red-600 text-xs mt-1">{errors.confirmPassword.message}</p>}
          </div>
          <div>
            <label htmlFor="mobile_number" className="sr-only">Mobile Number</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                id="mobile_number"
                {...register('mobile_number')}
                type="tel"
                placeholder="Mobile Number (10-15 digits)"
                disabled={isLoading}
                className={`w-full pl-10 pr-3 py-2 border ${errors.mobile_number ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-purple-500 focus:border-purple-500`}
                autoComplete="tel"
              />
            </div>
            {errors.mobile_number && <p className="text-red-600 text-xs mt-1">{errors.mobile_number.message}</p>}
          </div>
          <div>
            <label htmlFor="gender" className="sr-only">Gender</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 z-10" size={20} />
              <select
                id="gender"
                {...register('gender')}
                disabled={isLoading}
                className={`w-full pl-10 pr-3 py-2 border ${errors.gender ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-purple-500 focus:border-purple-500 appearance-none bg-white`}
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="neutral">Prefer not to say</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.172l-4.243-4.243L4.343 8z" /></svg>
              </div>
            </div>
            {errors.gender && <p className="text-red-600 text-xs mt-1">{errors.gender.message}</p>}
          </div>
          {error && <div className="rounded-md bg-red-100 border border-red-400 p-3"><div className="text-sm text-red-700 text-center">{error}</div></div>}
          <button type="submit" disabled={isLoading} className={`w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50 ${isLoading ? 'opacity-75 cursor-not-allowed' : ''}`}>{isLoading ? (<span className="flex items-center justify-center"><svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>Creating Account...</span>) : 'Create Account'}</button>
        </form>
        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-300"></div></div>
          <div className="relative flex justify-center text-sm"><span className="px-2 bg-white text-gray-500">Or continue with</span></div>
        </div>
        <div className="flex justify-center">
          <GoogleLogin onSuccess={handleGoogleSuccess} onError={handleGoogleError} useOneTap theme="filled_blue" shape="rectangular" text="signup_with" size="large" />
        </div>
        <div className="mt-6 text-center text-sm">
          <p className="text-gray-600">Already have an account? <Link to="/login" className="text-purple-600 hover:text-purple-800 font-bold">Log in</Link></p>
        </div>
        <style>{`
          @keyframes blob {
            0% { transform: translate(0px, 0px) scale(1); }
            33% { transform: translate(30px, -40px) scale(1.1); }
            66% { transform: translate(-20px, 20px) scale(0.9); }
            100% { transform: translate(0px, 0px) scale(1); }
          }
          .animate-blob { animation: blob 7s infinite; }
          .animation-delay-2000 { animation-delay: 2s; }
        `}</style>
      </div>
    </div>
  );
}
