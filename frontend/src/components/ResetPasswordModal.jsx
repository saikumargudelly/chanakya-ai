import React, { useState } from 'react';
import axios from 'axios';

export default function ResetPasswordModal({ onClose }) {
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!email || !newPassword || !confirmPassword) {
      setError('All fields are required.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      const res = await axios.post('http://localhost:5001/auth/reset_password', {
        email,
        new_password: newPassword,
      });
      setSuccess(res.data.message || 'Password reset successful!');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to reset password.');
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-900 p-8 rounded-xl shadow-lg w-full max-w-md relative">
        <button className="absolute top-2 right-2 text-gray-400 hover:text-gray-700" onClick={onClose}>✕</button>
        <h2 className="text-2xl font-bold mb-4 text-blue-700">Reset Password</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-700 dark:text-gray-200 mb-1">Email</label>
            <input className="w-full p-2 rounded bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100" type="email" value={email} onChange={e => setEmail(e.target.value)} disabled={loading} />
          </div>
          <div>
            <label className="block text-gray-700 dark:text-gray-200 mb-1">New Password</label>
            <input className="w-full p-2 rounded bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} disabled={loading} />
          </div>
          <div>
            <label className="block text-gray-700 dark:text-gray-200 mb-1">Confirm Password</label>
            <input className="w-full p-2 rounded bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} disabled={loading} />
          </div>
          <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded font-bold" disabled={loading}>Reset Password</button>
        </form>
        {success && <div className="mt-3 text-green-600">{success}</div>}
        {error && <div className="mt-3 text-red-600">{error}</div>}
      </div>
    </div>
  );
}
