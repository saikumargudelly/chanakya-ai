import React, { useState } from 'react';
import { useAuth } from './AuthContext';

export default function Profile({ onClose }) {
  const { user } = useAuth();
  // Assume user has username and email for demonstration
  const [username, setUsername] = useState(user?.username || '');
  const [email, setEmail] = useState(user?.email || '');
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccess(''); setError('');
    // TODO: Implement API call to update user details
    setSuccess('Profile updated (demo only).');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-900 p-8 rounded-xl shadow-lg w-full max-w-md relative">
        <button className="absolute top-2 right-2 text-gray-400 hover:text-gray-700" onClick={onClose}>✕</button>
        <h2 className="text-2xl font-bold mb-4 text-blue-700">Edit Profile</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-700 dark:text-gray-200 mb-1">Username</label>
            <input className="w-full p-2 rounded bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100" value={username} onChange={e => setUsername(e.target.value)} />
          </div>
          <div>
            <label className="block text-gray-700 dark:text-gray-200 mb-1">Email</label>
            <input className="w-full p-2 rounded bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100" value={email} onChange={e => setEmail(e.target.value)} />
          </div>
          <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded font-bold">Save Changes</button>
        </form>
        {success && <div className="mt-3 text-green-600">{success}</div>}
        {error && <div className="mt-3 text-red-600">{error}</div>}
      </div>
    </div>
  );
}
