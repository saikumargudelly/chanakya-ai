import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiSend, FiMic, FiImage, FiSmile, FiX, FiMinimize2, FiMaximize2 } from 'react-icons/fi';
import { useChat } from '../context/ChatContext';
import { MessageBubble } from './MessageBubble';
import { QuickReplyBar } from './QuickReplyBar';
import { MoodType } from '../types';

const moodThemes: Record<MoodType, string> = {
  calm: 'from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-900/10',
  happy: 'from-amber-50 to-yellow-100 dark:from-amber-900/30 dark:to-yellow-900/10',
  excited: 'from-pink-50 to-purple-100 dark:from-pink-900/30 dark:to-purple-900/10',
  stressed: 'from-red-50 to-orange-100 dark:from-red-900/30 dark:to-orange-900/10',
  neutral: 'from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900',
};

export const ChatDrawer: React.FC = () => {
  const {
    messages,
    sendMessage,
    isOpen,
    toggleChat,
    config,
    quickReplies,
    isTyping,
    userContext,
  } = useChat();

  const [inputValue, setInputValue] = useState('');
  const [isMinimized, setIsMinimized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = () => {
    if (inputValue.trim()) {
      sendMessage(inputValue);
      setInputValue('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleQuickReply = (text: string) => {
    sendMessage(text);
  };

  const toggleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-24 right-6 w-full max-w-md h-[70vh] z-50">
      <motion.div
        className="relative w-full h-full bg-white dark:bg-gray-800 rounded-t-2xl shadow-2xl overflow-hidden flex flex-col"
        initial={{ y: '100%', opacity: 0 }}
        animate={{ y: isMinimized ? 'calc(100% - 60px)' : '0%', opacity: 1 }}
        exit={{ y: '100%', opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      >
        {/* Header */}
        <div 
          className={`p-4 bg-gradient-to-r ${moodThemes[userContext.mood]} flex items-center justify-between cursor-pointer`}
          onClick={isMinimized ? toggleMinimize : undefined}
        >
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-full bg-white dark:bg-gray-700 flex items-center justify-center mr-3 shadow-md">
              {config.assistantGender === 'male' ? '👨‍💼' : 
               config.assistantGender === 'female' ? '👩‍💼' : '🧙'}
            </div>
            <div>
              <h3 className="font-semibold text-gray-800 dark:text-white">
                {config.assistantName}
              </h3>
              <p className="text-xs text-gray-600 dark:text-gray-300">
                {isTyping ? 'Typing...' : 'Online'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button 
              onClick={toggleMinimize}
              className="p-1 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
              aria-label={isMinimized ? 'Maximize' : 'Minimize'}
            >
              {isMinimized ? <FiMaximize2 /> : <FiMinimize2 />}
            </button>
            <button 
              onClick={toggleChat}
              className="p-1 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
              aria-label="Close chat"
            >
              <FiX />
            </button>
          </div>
        </div>
        
        {!isMinimized && (
          <>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-white to-gray-50 dark:from-gray-800 dark:to-gray-900">
              {messages.map((message) => (
                <MessageBubble
                  key={message.id}
                  message={message}
                  isUser={message.sender === 'user'}
                  assistantName={config.assistantName}
                  assistantGender={config.assistantGender}
                />
              ))}
              
              {isTyping && (
                <div className="flex items-center space-x-2 p-3">
                  <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                    {config.assistantGender === 'male' ? '👨‍💼' : 
                     config.assistantGender === 'female' ? '👩‍💼' : '🧙'}
                  </div>
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
            
            {/* Quick Replies */}
            <QuickReplyBar 
              quickReplies={quickReplies} 
              onSelect={handleQuickReply} 
              visible={!isTyping && inputValue === ''}
            />
            
            {/* Input Area */}
            <div className="p-3 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-full px-4 py-2">
                <button className="text-gray-500 hover:text-indigo-500 transition-colors p-1">
                  <FiSmile className="w-5 h-5" />
                </button>
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type a message..."
                  className="flex-1 bg-transparent border-none outline-none px-3 py-1 text-gray-800 dark:text-gray-200 placeholder-gray-400"
                />
                <div className="flex items-center space-x-1">
                  <button className="text-gray-500 hover:text-indigo-500 transition-colors p-1">
                    <FiImage className="w-5 h-5" />
                  </button>
                  <button className="text-gray-500 hover:text-indigo-500 transition-colors p-1">
                    <FiMic className="w-5 h-5" />
                  </button>
                  <button
                    onClick={handleSendMessage}
                    disabled={!inputValue.trim()}
                    className={`p-1.5 rounded-full ${
                      inputValue.trim()
                        ? 'bg-indigo-500 text-white hover:bg-indigo-600'
                        : 'text-gray-400 cursor-not-allowed'
                    } transition-colors`}
                  >
                    <FiSend className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
};
