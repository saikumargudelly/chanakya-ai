import React, { useState, useRef, useEffect } from 'react';
import api from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { FiSend, FiLoader } from 'react-icons/fi';
import { useAuth } from './AuthContext';

const MessageBubble = ({ message, isUser, userInitial = 'U', aiInitial = 'C' }) => {
  const bubbleClass = isUser 
    ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-br-none ml-auto' 
    : 'bg-white dark:bg-gray-800 text-gray-800 rounded-bl-none mr-auto dark:text-gray-200 shadow-sm';
  const bubbleAlignment = isUser ? 'flex-row-reverse' : 'flex-row';
  const avatar = isUser ? userInitial : aiInitial;
  const avatarBg = isUser ? 'bg-blue-400' : 'bg-purple-500';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.9 }}
      transition={{ duration: 0.3 }}
      className={`flex items-end gap-2 ${bubbleAlignment} mb-4`}
    >
      <div className={`w-8 h-8 rounded-full ${avatarBg} flex items-center justify-center text-white text-sm font-bold flex-shrink-0`}>
        {avatar}
      </div>
      <div className={`p-3 rounded-lg max-w-xs break-words ${bubbleClass}`}>
        {message}
      </div>
    </motion.div>
  );
};

const LoadingIndicator = () => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="flex items-center justify-center mb-4 text-gray-600 dark:text-gray-400"
  >
    <FiLoader className="animate-spin text-blue-500 text-2xl mr-2" />
    <span>Chanakya is thinking...</span>
  </motion.div>
);

const WelcomeMessage = () => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay: 0.2 }}
    className="text-center text-gray-600 dark:text-gray-400 italic mb-6 p-4 bg-gray-200 dark:bg-gray-700 rounded-lg"
  >
    <p>Welcome! Ask me anything about your finances.</p>
  </motion.div>
);

const ChatBox = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (input.trim() === '' || isLoading) return;

    const userMessage = input.trim();
    setMessages(prevMessages => [...prevMessages, { text: userMessage, isUser: true }]);
    setInput('');
    setIsLoading(true);

    try {
      const userId = user?.id;
      
      const response = await api.post('/api/chat', {
        user_id: userId,
        message: userMessage,
      });

      setMessages(prevMessages => [...prevMessages, { text: response.data.response, isUser: false }]);
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prevMessages => [...prevMessages, { text: 'Error: Could not get a response from Chanakya.', isUser: false }]);
    } finally {
      setIsLoading(false);
    }
  };

  const getUserInitials = () => {
    if (user?.first_name && user?.last_name) {
      return `${user.first_name.charAt(0)}${user.last_name.charAt(0)}`.toUpperCase();
    } else if (user?.first_name) {
      return user.first_name.charAt(0).toUpperCase();
    } else {
      return 'U';
    }
  };

  const userInitial = getUserInitials();

  return (
    <div className="flex flex-col h-full bg-gray-100 dark:bg-gray-900 rounded-lg shadow-inner">
      <div className="flex-1 p-4 overflow-y-auto">
        <AnimatePresence>
          {messages.length === 0 && <WelcomeMessage key="welcome" />}
          {messages.map((msg, index) => (
            <MessageBubble 
              key={index} 
              message={msg.text} 
              isUser={msg.isUser}
              userInitial={userInitial}
            />
          ))}
          {isLoading && <LoadingIndicator key="loading" />}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={sendMessage} className="p-4 border-t border-gray-200 dark:border-gray-700 flex items-center bg-white dark:bg-gray-800">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Say something to Chanakya..."
          className="flex-grow p-3 rounded-l-md border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
          disabled={isLoading}
        />
        <motion.button
          type="submit"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="bg-blue-500 hover:bg-blue-600 text-white p-3 rounded-r-md ml-1 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isLoading || input.trim() === ''}
        >
          <FiSend size={24} />
        </motion.button>
      </form>
    </div>
  );
};

export default ChatBox;
