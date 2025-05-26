import React, { createContext, useContext, useState, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Message, QuickReply, UserContext, ChatConfig, ChatContextType } from '../types/chat';

const defaultConfig: ChatConfig = {
  isOpen: false,
  assistantName: 'Goal Master',
  assistantGender: 'neutral',
  theme: {
    primary: '#4F46E5',
    secondary: '#818CF8',
    background: '#FFFFFF',
    text: '#1F2937'
  }
};

const defaultUserContext: UserContext = {
  name: 'User',
  gender: 'neutral',
  mood: 'neutral',
  wisdomLevel: 1,
  xp: 0
};

const defaultQuickReplies: QuickReply[] = [
  {
    id: uuidv4(),
    text: 'Set a new goal',
    emoji: '🎯',
    payload: 'I want to set a new goal'
  },
  {
    id: uuidv4(),
    text: 'Track my progress',
    emoji: '📊',
    payload: 'Show me my progress'
  },
  {
    id: uuidv4(),
    text: 'Need motivation',
    emoji: '💪',
    payload: 'I need some motivation'
  }
];

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [mood, setMood] = useState<'happy' | 'neutral' | 'sad' | 'stressed'>('neutral');
  const [isOpen, setIsOpen] = useState(false);
  const [userContext, setUserContext] = useState<UserContext>(defaultUserContext);

  const sendMessage = useCallback(async (content: string) => {
    const userMessage: Message = {
      id: uuidv4(),
      text: content,
      sender: 'user',
      timestamp: new Date(),
      mood
    };

    setMessages(prev => [...prev, userMessage]);
    setIsTyping(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: content,
          mood,
          gender: userContext.gender,
          model: 'goal_master'
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const data = await response.json();
      
      const assistantMessage: Message = {
        id: uuidv4(),
        text: data.response,
        sender: 'assistant',
        timestamp: new Date(data.timestamp)
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: uuidv4(),
        text: 'Sorry, I encountered an error. Please try again.',
        sender: 'assistant',
        timestamp: new Date(),
        isError: true
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  }, [mood, userContext.gender]);

  const toggleChat = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);

  const updateUserContext = useCallback((updates: Partial<UserContext>) => {
    setUserContext(prev => ({ ...prev, ...updates }));
  }, []);

  const value: ChatContextType = {
    messages,
    isTyping,
    mood,
    sendMessage,
    setTyping: setIsTyping,
    setMood,
    isOpen,
    toggleChat,
    config: defaultConfig,
    quickReplies: defaultQuickReplies,
    userContext,
    updateUserContext
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}; 