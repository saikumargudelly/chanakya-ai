import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';

export default function Signup({ onLoginClick }) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [gender, setGender] = useState('male');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!email || !password || !firstName || !lastName || !mobileNumber) {
      setError('All fields are required.');
      return;
    }
    try {
      await axios.post('http://localhost:5001/auth/register', {
        email,
        password,
        first_name: firstName,
        last_name: lastName,
        mobile_number: mobileNumber,
        gender
      });
      setSuccess('Signup successful! You can now log in.');
      setTimeout(() => onLoginClick(), 1000);
    } catch (err) {
      setError(err.response?.data?.error || 'Signup failed');
    }
  };

  return (
    <div className="max-w-sm mx-auto mt-20 p-8 bg-gray-800 rounded shadow">
      <h2 className="text-xl font-bold mb-4">Sign Up</h2>
      <form onSubmit={handleSubmit}>
        <input className="w-full mb-4 p-2 rounded bg-gray-700 text-white" placeholder="First Name" type="text" value={firstName} onChange={e => setFirstName(e.target.value)} />
        <input className="w-full mb-4 p-2 rounded bg-gray-700 text-white" placeholder="Last Name" type="text" value={lastName} onChange={e => setLastName(e.target.value)} />
        <input className="w-full mb-4 p-2 rounded bg-gray-700 text-white" placeholder="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} />
        <input className="w-full mb-4 p-2 rounded bg-gray-700 text-white" placeholder="Mobile Number" type="text" value={mobileNumber} onChange={e => setMobileNumber(e.target.value)} />
        <div className="mb-4">
          <label className="block text-gray-300 text-sm mb-2">Gender</label>
          <select 
            className="w-full p-2 rounded bg-gray-700 text-white" 
            value={gender} 
            onChange={e => setGender(e.target.value)}
          >
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
        </div>
        <input className="w-full mb-4 p-2 rounded bg-gray-700 text-white" placeholder="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} />
        {error && <div className="text-red-400 mb-2">{error}</div>}
        {success && <div className="text-green-400 mb-2">{success}</div>}
        <button className="w-full bg-blue-600 py-2 rounded text-white font-bold" type="submit">Sign Up</button>
      </form>
      <div className="mt-2 text-sm text-gray-400">Already have an account? <button className="underline" onClick={onLoginClick}>Log in</button></div>
    </div>
  );
}
