import React, { createContext, useContext, useState, useCallback, ReactNode, useMemo } from 'react';
import { Message, MoodType, ChatConfig, UserContext as UserContextType, ChatContextType } from '../types/chat';

const defaultConfig: ChatConfig = {
  isOpen: false,
  assistantName: 'Rukmini',
  assistantGender: 'female',
  theme: {
    primary: '#4f46e5',
    secondary: '#7c3aed',
    background: '#ffffff',
    text: '#1f2937'
  }
};

const defaultUserContext: UserContextType = {
  name: 'User',
  gender: 'neutral',
  mood: 'neutral',
  wisdomLevel: 1,
  xp: 0
};

const defaultQuickReplies = [
  { id: '1', text: 'Tell me more', emoji: '💭', payload: 'tell_me_more' },
  { id: '2', text: 'How does this work?', emoji: '❓', payload: 'how_it_works' },
  { id: '3', text: 'Thanks!', emoji: '🙏', payload: 'thanks' },
];

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [mood, setMood] = useState<MoodType>('neutral');
  const [isOpen, setIsOpen] = useState(false);
  
  const toggleChat = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);
  
  const config = useMemo(() => defaultConfig, []);
  const userContext = useMemo(() => defaultUserContext, []);
  const quickReplies = useMemo(() => defaultQuickReplies, []);

  const sendMessage = useCallback((content: string) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      text: content,
      sender: 'user',
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, newMessage]);
  }, []);

  const contextValue = useMemo(() => ({
    messages,
    isTyping,
    mood,
    sendMessage,
    setTyping: setIsTyping,
    setMood,
    isOpen,
    toggleChat,
    config,
    quickReplies,
    userContext,
  }), [messages, isTyping, mood, sendMessage, isOpen, toggleChat, config, quickReplies, userContext]);

  return (
    <ChatContext.Provider value={contextValue}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = (): ChatContextType => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};
