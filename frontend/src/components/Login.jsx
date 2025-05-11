import React, { useState } from 'react';
import ResetPasswordModal from './ResetPasswordModal';
import axios from 'axios';
import { useAuth } from './AuthContext';

export default function Login({ onSignupClick }) {
  const [showReset, setShowReset] = useState(false);
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await axios.post('http://localhost:5001/auth/login', { email, password });
      login(res.data.token, res.data.user_id, undefined, res.data.email);
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    }
  };

  return (
    <div className="max-w-sm mx-auto mt-20 p-8 bg-gray-800 rounded shadow">
      <h2 className="text-xl font-bold mb-4">Login</h2>
      <form onSubmit={handleSubmit}>
        <input className="w-full mb-4 p-2 rounded bg-gray-700 text-white" placeholder="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} />
        <input className="w-full mb-4 p-2 rounded bg-gray-700 text-white" placeholder="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} />
        {error && <div className="text-red-400 mb-2">{error}</div>}
        <button className="w-full bg-blue-600 py-2 rounded text-white font-bold" type="submit">Login</button>
<div className="text-right mt-2">
  <button
    type="button"
    className="text-blue-400 hover:underline text-sm"
    onClick={() => setShowReset(true)}
  >
    Forgot password?
  </button>
</div>
      </form>
      <div className="mt-2 text-sm text-gray-400">Don't have an account? <button className="underline" onClick={onSignupClick}>Sign up</button></div>
      {showReset && <ResetPasswordModal onClose={() => setShowReset(false)} />}
    </div>
  );
}
