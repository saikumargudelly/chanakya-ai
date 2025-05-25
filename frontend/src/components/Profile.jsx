import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import API from '../services/api';

export default function Profile({ onClose }) {
  const { token, user, updateUser } = useAuth();
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
    try {
      // Send each field as a separate parameter
      const response = await API.put('/auth/users/me/', null, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          first_name: form.first_name,
          last_name: form.last_name,
          gender: form.gender,
          mobile_number: form.mobile_number,
          address: form.address
        }
      });
      setSuccess('Profile updated successfully!');
      setProfile({ ...profile, ...form });
      // Update the user data in AuthContext
      updateUser({
        first_name: form.first_name,
        last_name: form.last_name,
        email: form.email,
        mobile_number: form.mobile_number,
        gender: form.gender
      });
    } catch (err) {
      console.error('Profile update error:', err);
      setError(err.response?.data?.detail || 'Failed to update profile.');
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
