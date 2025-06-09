import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import API from '../services/api';

export default function Profile({ onClose }) {
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [form, setForm] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    email: user?.email || '',
    mobile_number: user?.mobile_number || '',
    gender: user?.gender || 'neutral',
  });

  // Fetch profile on mount
  useEffect(() => {
    async function fetchProfile() {
      setLoading(true);
      setError('');
      try {
        const res = await API.get('/auth/profile');
        const profileData = res.data;
        setForm(prev => ({
          ...prev,
          first_name: profileData.first_name || prev.first_name,
          last_name: profileData.last_name || prev.last_name,
          email: profileData.email || prev.email,
          mobile_number: profileData.mobile_number || prev.mobile_number,
          gender: profileData.gender || prev.gender,
        }));
      } catch (err) {
        setError('Failed to load profile.');
        console.error('Error fetching profile:', err);
      }
      setLoading(false);
    }
    fetchProfile();
  }, []);

  // Handle submit
  const handleSubmit = async e => {
    e.preventDefault();
    setSuccess('');
    setError('');
    setLoading(true);
    
    const formData = new FormData();
    formData.append('first_name', form.first_name);
    formData.append('last_name', form.last_name);
    formData.append('gender', form.gender);
    formData.append('mobile_number', form.mobile_number);

    try {
      console.log('Submitting form with gender:', form.gender);
      const response = await API.put('/auth/users/me/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      const updatedData = response.data;
      console.log('Received updated profile:', updatedData);
      
      if (!updatedData.gender) {
        console.error('No gender field in response:', updatedData);
        throw new Error('Invalid response from server');
      }

      // First update local state
      setForm(prev => ({
        ...prev,
        ...updatedData
      }));
      
      // Then update the global auth context with complete user data
      updateUser({
        ...user,
        ...updatedData,
        gender: updatedData.gender // Pass the gender directly from the server response
      });
      
      setSuccess('Profile updated successfully!');
    } catch (err) {
      console.error('Error updating profile:', err);
      let errorMessage = 'Failed to update profile. ';
      if (err.response?.data) {
        if (typeof err.response.data === 'object') {
          errorMessage += Object.entries(err.response.data)
            .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(' ') : value}`)
            .join(' | ');
        } else if (typeof err.response.data === 'string') {
          errorMessage += err.response.data;
        }
      } else {
        errorMessage += err.message || 'An unexpected error occurred.';
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Handle input changes
  const handleChange = e => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg w-full max-w-md relative" onClick={e => e.stopPropagation()}>
        <button 
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white transition-colors" 
          onClick={onClose}
        >
          ✕
        </button>
        
        <div className="text-center mb-6">
          <div className="w-20 h-20 rounded-full bg-indigo-600 flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4 shadow-md">
            {form.first_name ? form.first_name.charAt(0).toUpperCase() : 'U'}
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
            {loading ? 'Loading...' : `${form.first_name} ${form.last_name}`}
          </h2>
          <p className="text-gray-600 dark:text-gray-300">
            {loading ? 'Loading...' : form.email}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-800 dark:text-gray-100 font-medium mb-1">First Name</label>
              <input
                type="text"
                name="first_name"
                value={form.first_name}
                onChange={handleChange}
                className="w-full p-2 rounded bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-600 focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-800 transition-colors"
                disabled={loading}
              />
            </div>
            <div>
              <label className="block text-gray-800 dark:text-gray-100 font-medium mb-1">Last Name</label>
              <input
                type="text"
                name="last_name"
                value={form.last_name}
                onChange={handleChange}
                className="w-full p-2 rounded bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-600 focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-800 transition-colors"
                disabled={loading}
              />
            </div>
          </div>

          <div>
            <label className="block text-gray-800 dark:text-gray-100 font-medium mb-1">Mobile Number</label>
            <input
              type="tel"
              name="mobile_number"
              value={form.mobile_number}
              onChange={handleChange}
              className="w-full p-2 rounded bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-600 focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-800 transition-colors"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-gray-800 dark:text-gray-100 font-medium mb-1">Gender</label>
            <select
              className="w-full p-2 rounded bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-600 focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-800 transition-colors" 
              name="gender" 
              value={form.gender} 
              onChange={handleChange}
              disabled={loading}
            >
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="neutral">Prefer not to say</option>
            </select>
          </div>

          <button 
            type="submit" 
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded font-bold shadow-md hover:shadow-lg transition-all duration-200" 
            disabled={loading}
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </form>

        {success && (
          <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded border border-green-200 dark:border-green-800">
            {success}
          </div>
        )}
        {error && (
          <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded border border-red-200 dark:border-red-800">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
