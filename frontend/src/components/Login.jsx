import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';

export default function Login({ onSignupClick }) {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await axios.post('http://localhost:5001/auth/login', { username, password });
      login(res.data.token, res.data.user_id);
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    }
  };

  return (
    <div className="max-w-sm mx-auto mt-20 p-8 bg-gray-800 rounded shadow">
      <h2 className="text-xl font-bold mb-4">Login</h2>
      <form onSubmit={handleSubmit}>
        <input className="w-full mb-2 p-2 rounded bg-gray-700 text-white" placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} />
        <input className="w-full mb-4 p-2 rounded bg-gray-700 text-white" placeholder="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} />
        {error && <div className="text-red-400 mb-2">{error}</div>}
        <button className="w-full bg-blue-600 py-2 rounded text-white font-bold" type="submit">Login</button>
      </form>
      <div className="mt-2 text-sm text-gray-400">Don't have an account? <button className="underline" onClick={onSignupClick}>Sign up</button></div>
    </div>
  );
}
