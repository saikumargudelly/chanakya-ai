import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import API from '../services/api';

export default function Profile({ onClose }) {
  const { token } = useAuth();
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
      await API.put('/auth/profile', form, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSuccess('Profile updated successfully!');
      setProfile({ ...profile, ...form });
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update profile.');
    }
  };

  // Skeletons and placeholders
  const skeletonCircle = (
    <div className="w-20 h-20 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse mx-auto mb-4" />
  );
  const avatar = (
    <img
      src="https://ui-avatars.com/api/?name="
      alt="avatar"
      className="w-20 h-20 rounded-full mx-auto mb-4 opacity-0 animate-fadein"
      onLoad={e => e.target.classList.remove('opacity-0')}
      onError={e => (e.target.src = '/avatar-placeholder.png')}
    />
  );
  const fadeInAvatar = profile && profile.first_name
    ? <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(profile.first_name + ' ' + (profile.last_name || ''))}`} alt="avatar" className="w-20 h-20 rounded-full mx-auto mb-4 opacity-0 animate-fadein" onLoad={e => e.target.classList.remove('opacity-0')} onError={e => (e.target.src = '/avatar-placeholder.png')} />
    : skeletonCircle;

  const skeletonText = (
    <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-32 mx-auto mb-2 animate-pulse" />
  );
  const displayName = profile && (profile.first_name || profile.last_name)
    ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim()
    : error
      ? 'Guest User'
      : skeletonText;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-900 p-8 rounded-xl shadow-lg w-full max-w-md relative">
        <button className="absolute top-2 right-2 text-gray-400 hover:text-gray-700" onClick={onClose}>✕</button>
        {loading ? skeletonCircle : fadeInAvatar}
        <div className="text-center text-xl font-bold text-blue-700 mb-2">
          {loading ? skeletonText : displayName}
        </div>
        <div className="text-center text-gray-500 mb-4 text-sm">
          {loading ? skeletonText : (profile?.email || 'Guest User')}
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-700 dark:text-gray-200 mb-1">First Name</label>
            <input className="w-full p-2 rounded bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100" name="first_name" value={form.first_name} onChange={handleChange} disabled={loading} />
          </div>
          <div>
            <label className="block text-gray-700 dark:text-gray-200 mb-1">Last Name</label>
            <input className="w-full p-2 rounded bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100" name="last_name" value={form.last_name} onChange={handleChange} disabled={loading} />
          </div>
          <div>
            <label className="block text-gray-700 dark:text-gray-200 mb-1">Email <span className="text-red-500">*</span></label>
            <input className="w-full p-2 rounded bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100" name="email" value={form.email} onChange={handleChange} disabled={loading} required />
          </div>
          <div>
            <label className="block text-gray-700 dark:text-gray-200 mb-1">Mobile Number</label>
            <input className="w-full p-2 rounded bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100" name="mobile_number" value={form.mobile_number} onChange={handleChange} disabled={loading} />
          </div>
          <div>
            <label className="block text-gray-700 dark:text-gray-200 mb-1">Address</label>
            <input className="w-full p-2 rounded bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100" name="address" value={form.address} onChange={handleChange} disabled={loading} />
          </div>
          <div>
            <label className="block text-gray-700 dark:text-gray-200 mb-1">Gender</label>
            <select 
              className="w-full p-2 rounded bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100" 
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
          <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded font-bold" disabled={loading}>Save Changes</button>
        </form>
        {success && <div className="mt-3 text-green-600">{success}</div>}
        {error && <div className="mt-3 text-red-600">{error}</div>}
      </div>
    </div>
  );
}
