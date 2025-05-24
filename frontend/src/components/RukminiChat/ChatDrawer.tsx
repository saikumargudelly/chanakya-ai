import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useChat } from './context/ChatContext';
import { MoodType } from '../../types/chat';
import { MessageBubble } from './MessageBubble';
import { QuickReplyBar } from './QuickReplyBar';

// Inline SVG Icons
const MaximizeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>
  </svg>
);

const MinimizeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"/>
  </svg>
);

const XIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
);

const SmileIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"></circle>
    <path d="M8 14s1.5 2 4 2 4-2 4-2"></path>
    <line x1="9" y1="9" x2="9.01" y2="9"></line>
    <line x1="15" y1="9" x2="15.01" y2="9"></line>
  </svg>
);

const ImageIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
    <circle cx="8.5" cy="8.5" r="1.5"></circle>
    <polyline points="21 15 16 10 5 21"></polyline>
  </svg>
);

const MicIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
    <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
    <line x1="12" y1="19" x2="12" y2="23"></line>
    <line x1="8" y1="23" x2="16" y2="23"></line>
  </svg>
);

const SendIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13"></line>
    <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
  </svg>
);

// Re-export types for backward compatibility
export type { Message, QuickReply, ChatConfig, UserContext, MoodType } from '../../types/chat';

// Typing indicator component
interface TypingIndicatorProps {
  gender: string;
}

const TypingIndicator = React.memo(({ gender }: TypingIndicatorProps): React.ReactElement => {
  return (
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
  );
}) as React.FC<TypingIndicatorProps>;

TypingIndicator.displayName = 'TypingIndicator';

// Assistant avatar component
interface AssistantAvatarProps {
  gender: string;
  size?: 'sm' | 'md';
}

const AssistantAvatar = React.memo(({ gender, size = 'md' }: AssistantAvatarProps): React.ReactElement => {
  const sizeClasses = size === 'md' ? 'w-10 h-10' : 'w-8 h-8';
  return (
    <div className={`${sizeClasses} rounded-full bg-white dark:bg-gray-700 flex items-center justify-center shadow-md`}>
      {gender === 'male' ? '👨‍💼' : gender === 'female' ? '👩‍💼' : '🧙'}
    </div>
  );
}) as React.FC<AssistantAvatarProps>;

AssistantAvatar.displayName = 'AssistantAvatar';

const moodIcons: Record<MoodType, string> = {
  calm: '😌',
  happy: '😊',
  excited: '😃',
  stressed: '😫',
  neutral: '😐'
};

const moodThemes: Record<MoodType, string> = {
  calm: 'from-blue-400 to-blue-600',
  happy: 'from-yellow-300 to-amber-500',
  excited: 'from-pink-400 to-rose-500',
  stressed: 'from-red-400 to-red-600',
  neutral: 'from-gray-400 to-gray-500'
};

interface ChatDrawerProps {
  // Add any props here if needed
}

const ChatDrawer: React.FC<ChatDrawerProps> = (): React.ReactElement => {
  const {
    messages = [],
    isOpen,
    isTyping,
    toggleChat,
    config: { assistantName, assistantGender },
    quickReplies,
    userContext,
    sendMessage,
  } = useChat();
  
  const [inputValue, setInputValue] = React.useState('');
  const [isMinimized, setIsMinimized] = React.useState(false);
  const [currentMood, setCurrentMood] = React.useState<MoodType>('neutral');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  
  // Set mood from user context or default to neutral
  React.useEffect(() => {
    if (userContext?.mood) {
      setCurrentMood(userContext.mood);
    }
  }, [userContext?.mood]);

  // Memoize the message list to prevent unnecessary re-renders
  const messageList = React.useMemo(() => 
    messages.map((message) => ({
      id: message.id,
      text: message.text || '',
      sender: message.sender,
      timestamp: message.timestamp,
      mood: message.mood,
      isError: message.isError
    }))
  , [messages]);

  // Memoize the message bubbles to prevent unnecessary re-renders
  const messageBubbles = React.useMemo(() => 
    messageList.map((message) => (
      <MessageBubble
        key={message.id}
        message={message}
        isUser={message.sender === 'user'}
        assistantName={assistantName}
        assistantGender={assistantGender}
      />
    ))
  , [messageList, assistantName, assistantGender]);

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

  const handleQuickReply = useCallback((quickReply: { text: string; emoji: string; payload?: string }) => {
    sendMessage(quickReply.text);
  }, [sendMessage]);

  const toggleMinimize = useCallback(() => {
    setIsMinimized(prev => !prev);
  }, []);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  }, []);

  // Handle escape key to close the chat
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        toggleChat();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => {
      window.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, toggleChat]);

  return (
    <AnimatePresence key="chat-drawer-presence">
      {/* Overlay */}
      <motion.div
        key="chat-overlay"
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        initial={{ opacity: 0 }}
        animate={{ opacity: isOpen ? 1 : 0 }}
        exit={{ opacity: 0 }}
        onClick={() => toggleChat()}
        style={{ pointerEvents: isOpen ? 'auto' : 'none' }}
      />
      
      {/* Chat Drawer */}
      <motion.div
        key="chat-drawer"
        className="chat-drawer-container fixed bottom-0 right-4 w-full max-w-md h-[70vh] max-h-[800px] bg-white dark:bg-gray-800 rounded-t-xl shadow-2xl flex flex-col z-50 overflow-hidden"
        initial={{ y: '100%' }}
        animate={{ 
          y: isOpen ? 0 : '100%',
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? 'auto' : 'none'
        }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div 
          className={`p-4 bg-gradient-to-r ${moodThemes[currentMood]} flex items-center justify-between cursor-pointer`}
          onClick={toggleMinimize}
        >
          <div className="flex items-center space-x-3">
            <AssistantAvatar gender={assistantGender} />
            <div>
              <h3 className="font-medium text-white">{assistantName}</h3>
              <p className="text-xs text-white/80">
                {isTyping ? 'Typing...' : 'Online'}
              </p>
            </div>
          </div>
          <div className="flex space-x-2">
            <button 
              className="p-1 rounded-full hover:bg-black/10 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                toggleMinimize();
              }}
              aria-label={isMinimized ? 'Maximize' : 'Minimize'}
            >
              {isMinimized ? <MaximizeIcon /> : <MinimizeIcon />}
            </button>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                toggleChat();
              }}
              className="p-1 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
              aria-label="Close chat"
            >
              <XIcon />
            </button>
          </div>
        </div>

        <AnimatePresence key="chat-content-presence">
          {!isMinimized && (
            <motion.div 
              key="chat-content"
              className="flex-1 flex flex-col overflow-hidden"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              {/* Messages Container */}
              <div 
                ref={messagesContainerRef}
                className="flex-1 overflow-y-auto p-4 space-y-4"
              >
                {messageBubbles}
                {isTyping && <TypingIndicator gender={assistantGender} />}
                <div ref={messagesEndRef} />
              </div>

              {/* Quick Replies */}
              {quickReplies && quickReplies.length > 0 && (
                <QuickReplyBar 
                  quickReplies={quickReplies} 
                  onQuickReply={handleQuickReply} 
                  key="quick-replies"
                />
              )}

              {/* Input Area */}
              <div className="border-t border-gray-200 dark:border-gray-700 p-3 bg-white dark:bg-gray-800">
                <div className="relative">
                  <input
                    ref={inputRef}
                    type="text"
                    value={inputValue}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    placeholder="Type a message..."
                    className="w-full bg-gray-100 dark:bg-gray-700 rounded-full py-3 px-4 pr-12 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    disabled={isTyping}
                  />
                  <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex space-x-1">
                    <button 
                      key="smile-button"
                      className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                    >
                      <SmileIcon />
                    </button>
                    <button 
                      key="image-button"
                      className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                    >
                      <ImageIcon />
                    </button>
                    <button 
                      key="mic-button"
                      className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                    >
                      <MicIcon />
                    </button>
                  </div>
                </div>
                <div className="flex justify-end mt-2">
                  <button
                    key="send-button"
                    onClick={handleSendMessage}
                    disabled={!inputValue.trim() || isTyping}
                    className={`p-2 rounded-full ${
                      inputValue.trim()
                        ? 'bg-indigo-600 hover:bg-indigo-700'
                        : 'bg-gray-300 dark:bg-gray-600 cursor-not-allowed'
                    } transition-colors`}
                    aria-label="Send message"
                  >
                    <SendIcon />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  );
};

const MemoizedChatDrawer = React.memo(ChatDrawer);

export default MemoizedChatDrawer;
