import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Message, UserContext, ChatConfig, MoodType, Gender, QuickReply } from '../types';

interface ChatContextType {
  messages: Message[];
  sendMessage: (text: string) => void;
  isOpen: boolean;
  toggleChat: () => void;
  userContext: UserContext;
  updateUserContext: (updates: Partial<UserContext>) => void;
  config: ChatConfig;
  quickReplies: QuickReply[];
  isTyping: boolean;
}

const defaultUserContext: UserContext = {
  gender: 'neutral',
  name: 'Friend',
  mood: 'neutral',
  wisdomLevel: 1,
  xp: 0,
};

const defaultConfig: ChatConfig = {
  isOpen: false,
  assistantName: 'Chanakya',
  assistantGender: 'neutral',
  theme: {
    primary: '#6366f1',
    secondary: '#8b5cf6',
    background: 'rgba(255, 255, 255, 0.1)',
    text: '#1f2937',
  },
};

const defaultQuickReplies: QuickReply[] = [
  { id: '1', text: 'How can I save money?', emoji: '💰' },
  { id: '2', text: 'I\'m feeling stressed', emoji: '😫' },
  { id: '3', text: 'Tell me a tip', emoji: '💡' },
];

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [userContext, setUserContext] = useState<UserContext>(() => {
    const saved = localStorage.getItem('chatUserContext');
    return saved ? JSON.parse(saved) : defaultUserContext;
  });
  
  const [config, setConfig] = useState<ChatConfig>(() => {
    const saved = localStorage.getItem('chatConfig');
    return saved ? JSON.parse(saved) : defaultConfig;
  });

  const quickReplies = defaultQuickReplies;

  useEffect(() => {
    // Set assistant name and gender based on user's gender
    const assistantName = userContext.gender === 'female' ? 'Krish' : 
                         userContext.gender === 'male' ? 'Rukmini' : 'Chanakya';
    const assistantGender = userContext.gender === 'female' ? 'male' : 
                           userContext.gender === 'male' ? 'female' : 'neutral';
    
    setConfig(prev => ({
      ...prev,
      assistantName,
      assistantGender,
    }));

    // Add welcome message if no messages exist
    if (messages.length === 0) {
      const welcomeMessage = {
        id: uuidv4(),
        text: `Hi${userContext.name !== 'Friend' ? ' ' + userContext.name : ''}! I'm ${assistantName}, your personal guide. How can I help you today?`,        sender: 'assistant' as const,
        timestamp: new Date(),
      };
      setMessages([welcomeMessage]);
    }
  }, [userContext.gender, userContext.name]);

  const updateUserContext = (updates: Partial<UserContext>) => {
    setUserContext(prev => {
      const newContext = { ...prev, ...updates };
      localStorage.setItem('chatUserContext', JSON.stringify(newContext));
      return newContext;
    });
  };

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;

    // Add user message
    const userMessage: Message = {
      id: uuidv4(),
      text,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      const responseMessage: Message = {
        id: uuidv4(),
        text: generateResponse(text),
        sender: 'assistant',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, responseMessage]);
      setIsTyping(false);
    }, 1000 + Math.random() * 1000);
  };

  const generateResponse = (text: string): string => {
    // Simple response logic - in a real app, this would call your AI backend
    const lowerText = text.toLowerCase();
    
    if (lowerText.includes('hello') || lowerText.includes('hi') || lowerText.includes('hey')) {
      return `Hello${userContext.name !== 'Friend' ? ' ' + userContext.name : ''}! How can I assist you today?`;
    } else if (lowerText.includes('thank')) {
      return 'You\'re welcome! Is there anything else I can help with?';
    } else if (lowerText.includes('money') || lowerText.includes('save')) {
      return 'A great way to save money is to follow the 50/30/20 rule: 50% needs, 30% wants, and 20% savings.';
    } else if (lowerText.includes('stressed') || lowerText.includes('anxious')) {
      updateUserContext({ mood: 'stressed' });
      return 'I\'m sorry to hear you\'re feeling stressed. Try taking a few deep breaths. Would you like me to guide you through a quick breathing exercise?';
    } else {
      return 'That\'s an interesting thought. I\'m here to help with financial advice and wellness tips. Could you tell me more about what you\'re looking for?';
    }
  };

  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  return (
    <ChatContext.Provider
      value={{
        messages,
        sendMessage,
        isOpen,
        toggleChat,
        userContext,
        updateUserContext,
        config,
        quickReplies,
        isTyping,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = (): ChatContextType => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};
