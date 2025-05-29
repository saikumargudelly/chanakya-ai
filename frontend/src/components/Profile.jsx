import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import API from '../services/api';

export default function Profile({ onClose }) {
  const auth = useAuth();
  const token = auth?.token;
  const user = auth?.user;
  const updateUser = auth?.updateUser;
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    mobile_number: '',
    address: '',
    gender: 'neutral',
  });

  // Fetch profile on mount
  useEffect(() => {
    async function fetchProfile() {
      setLoading(true);
      setError('');
      try {
        const res = await API.get('/auth/profile', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setProfile(res.data);
        setForm({
          first_name: res.data.first_name || '',
          last_name: res.data.last_name || '',
          email: res.data.email || '',
          mobile_number: res.data.mobile_number || '',
          address: res.data.address || '',
          gender: res.data.gender || 'neutral',
        });
      } catch (err) {
        setError('Failed to load profile.');
      }
      setLoading(false);
    }
    fetchProfile();
  }, [token]);

  // Handle input changes
  const handleChange = e => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  };

  // Handle submit
  const handleSubmit = async e => {
    e.preventDefault();
    setSuccess('');
    setError('');
    setLoading(true);
    
    // Prepare the update data
    const updateData = {
      first_name: form.first_name,
      last_name: form.last_name,
      gender: form.gender,
      mobile_number: form.mobile_number,
      address: form.address
    };

    console.log('Sending profile update:', updateData);

    try {
      // Send data in the request body
      const response = await API.put('/auth/users/me/', updateData, {
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('Profile update response:', response.data);
      
      setSuccess('Profile updated successfully!');
      
      // Update local profile state
      const updatedProfile = { ...profile, ...updateData };
      setProfile(updatedProfile);
      
      // Update the user data in AuthContext if updateUser is available
      if (typeof updateUser === 'function') {
        try {
          updateUser({
            first_name: updatedProfile.first_name,
            last_name: updatedProfile.last_name,
            email: updatedProfile.email,
            mobile_number: updatedProfile.mobile_number,
            gender: updatedProfile.gender
          });
          console.log('Auth context updated successfully');
        } catch (updateError) {
          console.warn('Failed to update auth context:', updateError);
          // Don't fail the whole operation if just the context update fails
        }
      } else {
        console.warn('updateUser function not available in auth context');
      }
      
      // Log the success
      console.log('Profile updated successfully');
    } catch (err) {
      // Log complete error details
      const errorDetails = {
        message: err.message,
        response: {
          data: err.response?.data,
          status: err.response?.status,
          statusText: err.response?.statusText,
          headers: err.response?.headers,
        },
        request: {
          url: err.config?.url,
          method: err.config?.method,
          data: err.config?.data,
          headers: err.config?.headers,
        },
      };
      
      console.error('Profile update error details:', errorDetails);
      
      // Try to get a more specific error message
      let errorMessage = 'Failed to update profile. ';
      
      if (err.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        if (err.response.data) {
          if (typeof err.response.data === 'object') {
            errorMessage += Object.entries(err.response.data)
              .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(' ') : value}`)
              .join(' | ');
          } else if (typeof err.response.data === 'string') {
            errorMessage += err.response.data;
          }
        }
        errorMessage += ` (Status: ${err.response.status})`;
      } else if (err.request) {
        // The request was made but no response was received
        console.error('No response received:', err.request);
        errorMessage += 'No response received from server. Please check your connection.';
      } else {
        // Something happened in setting up the request
        console.error('Request setup error:', err.message);
        errorMessage += err.message;
      }
    }
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
            {profile?.first_name ? profile.first_name.charAt(0).toUpperCase() : 'U'}
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
            <label className="block text-gray-800 dark:text-gray-100 font-medium mb-1">Email</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              className="w-full p-2 rounded bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-600 focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-800 transition-colors"
              disabled={loading}
            />
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
            <label className="block text-gray-800 dark:text-gray-100 font-medium mb-1">Address</label>
            <textarea
              name="address"
              value={form.address}
              onChange={handleChange}
              className="w-full p-2 rounded bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-600 focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-800 transition-colors"
              rows="3"
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
