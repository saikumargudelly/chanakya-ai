import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const ChatBox = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    const userMsg = { sender: 'user', text: input };
    setMessages((msgs) => [...msgs, userMsg]);
    setLoading(true);
    try {
      const res = await axios.post('http://localhost:5001/chat', { message: input });
      setMessages((msgs) => [...msgs, { sender: 'chanakya', text: res.data.response }]);
    } catch (err) {
      setMessages((msgs) => [...msgs, { sender: 'chanakya', text: 'Sorry, something went wrong.' }]);
    }
    setInput('');
    setLoading(false);
  };

  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700">
      <h2 className="text-2xl font-bold mb-4 text-indigo-700 dark:text-indigo-300 tracking-tight flex items-center gap-2">
        <span>🤖</span> Ask Chanakya Anything
      </h2>
      <div className="mb-4 max-h-60 overflow-y-auto space-y-2">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <span className={`inline-block px-4 py-2 rounded-2xl shadow text-base max-w-xs break-words
              ${msg.sender === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'}`}>{msg.text}</span>
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>
      <form onSubmit={sendMessage} className="flex gap-2 mt-2">
        <input
          className="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-700 transition"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Ask Chanakya anything..."
          disabled={loading}
        />
        <button type="submit" disabled={loading || !input.trim()} className="px-4 py-2 rounded-lg bg-gradient-to-r from-indigo-500 to-blue-600 text-white font-semibold shadow hover:from-indigo-600 hover:to-blue-700 disabled:opacity-50 transition">{loading ? '...' : 'Send'}</button>
      </form>
    </div>
  );
};

export default ChatBox;
