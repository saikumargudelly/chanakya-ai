import React, { useCallback, useRef, useEffect, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiSend, 
  FiMic, 
  FiImage, 
  FiSmile, 
  FiX, 
  FiMinimize2, 
  FiMaximize2 
} from 'react-icons/fi';
import { useChat } from './context/ChatContext';
import { MessageBubble } from './MessageBubble';
import { QuickReplyBar } from './QuickReplyBar';
import type { MoodType, Message } from './types';

// Memoized typing indicator to prevent unnecessary re-renders
const TypingIndicator = memo(({ gender }: { gender: string }) => (
  <div className="flex items-center space-x-2 p-3">
    <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
      {gender === 'male' ? '👨‍💼' : gender === 'female' ? '👩‍💼' : '🧙'}
    </div>
    <div className="flex space-x-1">
      {[0, 150, 300].map((delay) => (
        <div 
          key={delay}
          className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" 
          style={{ animationDelay: `${delay}ms` }} 
        />
      ))}
    </div>
  </div>
));

TypingIndicator.displayName = 'TypingIndicator';

// Memoized assistant avatar to prevent unnecessary re-renders
const AssistantAvatar = memo(({ gender, size = 'md' }: { 
  gender: string; 
  size?: 'sm' | 'md' 
}) => {
  const sizeClasses = size === 'md' ? 'w-10 h-10' : 'w-8 h-8';
  return (
    <div className={`${sizeClasses} rounded-full bg-white dark:bg-gray-700 flex items-center justify-center shadow-md`}>
      {gender === 'male' ? '👨‍💼' : gender === 'female' ? '👩‍💼' : '🧙'}
    </div>
  );
});

AssistantAvatar.displayName = 'AssistantAvatar';

const moodThemes: Record<MoodType, string> = {
  calm: 'from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-900/10',
  happy: 'from-amber-50 to-yellow-100 dark:from-amber-900/30 dark:to-yellow-900/10',
  excited: 'from-pink-50 to-purple-100 dark:from-pink-900/30 dark:to-purple-900/10',
  stressed: 'from-red-50 to-orange-100 dark:from-red-900/30 dark:to-orange-900/10',
  neutral: 'from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900',
};

const ChatDrawer: React.FC = () => {
  const {
    messages,
    sendMessage,
    isOpen,
    toggleChat,
    config: { assistantGender, assistantName },
    quickReplies,
    isTyping,
    userContext: { mood },
  } = useChat();

  const [inputValue, setInputValue] = React.useState('');
  const [isMinimized, setIsMinimized] = React.useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Memoize the message list to prevent unnecessary re-renders
  const messageList = React.useMemo(() => 
    messages.map((message) => (
      <MessageBubble
        key={message.id}
        message={message}
        isUser={message.sender === 'user'}
        assistantName={assistantName}
        assistantGender={assistantGender}
      />
    )),
    [messages, assistantName, assistantGender]
  );

  // Auto-scroll to bottom when messages change or when typing
  useEffect(() => {
    const scrollToBottom = () => {
      if (messagesEndRef.current && messagesContainerRef.current) {
        messagesContainerRef.current.scrollTo({
          top: messagesEndRef.current.offsetTop,
          behavior: 'smooth'
        });
      }
    };

    const timer = setTimeout(scrollToBottom, 100);
    return () => clearTimeout(timer);
  }, [messages, isTyping]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      const timer = setTimeout(() => inputRef.current?.focus(), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleSendMessage = useCallback(() => {
    const trimmedValue = inputValue.trim();
    if (trimmedValue) {
      sendMessage(trimmedValue);
      setInputValue('');
    }
  }, [inputValue, sendMessage]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }, [handleSendMessage]);

  const handleQuickReply = useCallback((text: string) => {
    sendMessage(text);
  }, [sendMessage]);

  const toggleMinimize = useCallback(() => {
    setIsMinimized(prev => !prev);
  }, []);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  }, []);

  // Add effect to handle escape key and click outside
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        toggleChat();
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const chatDrawer = document.querySelector('.chat-drawer-container');
      const chatAvatar = document.querySelector('.chat-avatar');
      
      if (isOpen && chatDrawer && !chatDrawer.contains(target) && chatAvatar && !chatAvatar.contains(target)) {
        toggleChat();
      }
    };

    window.addEventListener('keydown', handleEscape);
    document.addEventListener('mousedown', handleClickOutside);
    
    return () => {
      window.removeEventListener('keydown', handleEscape);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, toggleChat]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {/* Overlay */}
      <motion.div
        key="overlay"
        className="fixed inset-0 bg-black/30 z-[9998]"
        onClick={toggleChat}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
      />
      
      {/* Chat Drawer */}
      <motion.div
        key="chat-drawer"
        className="chat-drawer-container fixed bottom-0 right-0 w-full max-w-md h-[80vh] z-[9999] bg-white dark:bg-gray-800 rounded-t-lg shadow-xl overflow-hidden flex flex-col"
        style={{
          right: '1.5rem',
          maxWidth: '28rem',
          height: isMinimized ? '60px' : '80vh',
          pointerEvents: 'auto',
        }}
        initial={{ y: '100%', opacity: 0 }}
        animate={{ 
          y: isMinimized ? 'calc(100% - 60px)' : '0%',
          opacity: 1,
        }}
        exit={{ y: '100%', opacity: 0 }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && isMinimized && toggleMinimize()}
      >
        {/* Header */}
        <div 
          className={`p-4 bg-gradient-to-r ${moodThemes[mood]} flex items-center justify-between cursor-pointer`}
          onClick={isMinimized ? toggleMinimize : undefined}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && isMinimized && toggleMinimize()}
        >
          <div className="flex items-center">
            <AssistantAvatar gender={assistantGender} />
            <div className="ml-3">
              <h3 className="font-semibold text-gray-800 dark:text-white">
                {assistantName}
              </h3>
              <p className="text-xs text-gray-600 dark:text-gray-300">
                {isTyping ? 'Typing...' : 'Online'}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                toggleMinimize();
              }}
              className="p-1 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
              aria-label={isMinimized ? 'Maximize' : 'Minimize'}
            >
              {isMinimized ? <FiMaximize2 /> : <FiMinimize2 />}
            </button>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                toggleChat();
              }}
              className="p-1 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
              aria-label="Close chat"
            >
              <FiX className="w-5 h-5" />
            </button>
          </div>
        </div>

        {!isMinimized && (
          <>
            {/* Messages */}
            <div 
              ref={messagesContainerRef}
              className="flex-1 overflow-y-auto p-4 space-y-4"
            >
              {messageList}
              {isTyping && <TypingIndicator gender={assistantGender} />}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-800">
              <QuickReplyBar 
                quickReplies={quickReplies}
                onSelect={handleQuickReply}
                visible={!isMinimized}
              />
              <div className="mt-2 flex items-center">
                <div className="flex-1 relative">
                  <input
                    ref={inputRef}
                    type="text"
                    value={inputValue}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    placeholder="Type a message..."
                    className="w-full rounded-full border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white px-4 py-2 pr-12 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    aria-label="Type a message"
                  />
                  <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex space-x-1">
                    <button className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                      <FiSmile className="w-5 h-5" />
                    </button>
                    <button className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                      <FiImage className="w-5 h-5" />
                    </button>
                    <button className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                      <FiMic className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                <button
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim()}
                  className={`ml-2 p-2 rounded-full ${inputValue.trim()
                    ? 'bg-indigo-500 text-white hover:bg-indigo-600'
                    : 'text-gray-400 cursor-not-allowed'
                  } transition-colors`}
                  aria-label="Send message"
                >
                  <FiSend className="w-5 h-5" />
                </button>
              </div>
            </div>
          </>
        )}
      </motion.div>
    </AnimatePresence>
  );
};

export default memo(ChatDrawer);
