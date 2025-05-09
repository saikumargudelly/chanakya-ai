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
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 max-w-2xl mx-auto">
      <div className="h-64 overflow-y-auto mb-4 border-b border-gray-200 dark:border-gray-700 pb-2">
        {messages.map((msg, idx) => (
          <div key={idx} className={`mb-2 flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`px-3 py-2 rounded-lg max-w-xs ${msg.sender === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100'}`}>
              {msg.text}
            </div>
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>
      <form onSubmit={sendMessage} className="flex gap-2">
        <input
          className="flex-1 px-3 py-2 rounded border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 focus:outline-none"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Ask Chanakya anything..."
          disabled={loading}
        />
        <button type="submit" disabled={loading || !input.trim()} className="px-4 py-2 rounded bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-50">{loading ? '...' : 'Send'}</button>
      </form>
    </div>
  );
};

export default ChatBox;
