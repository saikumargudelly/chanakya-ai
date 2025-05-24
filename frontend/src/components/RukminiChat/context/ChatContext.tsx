import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Message, UserContext, ChatConfig, Gender, QuickReply } from '../types';
import { storage } from '../../../utils/storage';

// ===== Helper Functions =====
const getAssistantName = (userGender: Gender): string => {
  switch (userGender) {
    case 'male': return 'Rukmini';
    case 'female': return 'Krishna';
    default: return 'Chanakya';
  }
};

const getAssistantGender = (userGender: Gender): Gender => {
  switch (userGender) {
    case 'male': return 'female';
    case 'female': return 'male';
    default: return 'neutral';
  }
};

const getModelName = (userGender: Gender): string => {
  switch (userGender) {
    case 'male': return 'rukhmini';
    case 'female': return 'krishn';
    default: return 'chanakya';
  }
};

// ===== Default Values =====
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
  { id: '2', text: "I'm feeling stressed", emoji: '😫' },
  { id: '3', text: 'Tell me a tip', emoji: '💡' },
];

// ===== Context Types =====
interface ChatContextType {
  messages: Message[];
  sendMessage: (text: string) => void;
  isOpen: boolean;
  toggleChat: (forceState?: boolean) => void;
  userContext: UserContext;
  updateUserContext: (updates: Partial<UserContext>) => void;
  config: ChatConfig;
  quickReplies: QuickReply[];
  isTyping: boolean;
}

interface ChatProviderProps {
  children: React.ReactNode;
  defaultGender?: Gender;
  userName?: string;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

// ===== Main Provider Component =====
export const ChatProvider: React.FC<ChatProviderProps> = ({
  children,
  defaultGender = 'neutral',
  userName = 'Friend',
}) => {
  // State initialization
  const [messages, setMessages] = useState<Message[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const isInitialized = useRef(false);

  // Initialize user context with saved data or defaults
  const [userContext, setUserContext] = useState<UserContext>(() => {
    const saved = storage.get<UserContext>('userContext', defaultUserContext);
    const gender = (saved?.gender && ['male', 'female', 'neutral'].includes(saved.gender))
      ? saved.gender as Gender
      : defaultGender;
    
    console.log('Initializing user context:', { 
      savedGender: saved?.gender, 
      defaultGender,
      finalGender: gender,
      assistantName: getAssistantName(gender),
      assistantGender: getAssistantGender(gender),
      model: getModelName(gender)
    });
    
    return {
      ...defaultUserContext,
      ...saved,
      gender,
      name: saved?.name || userName,
    };
  });

  // Log when user context changes
  useEffect(() => {
    console.log('User context updated:', {
      gender: userContext.gender,
      assistantName: getAssistantName(userContext.gender),
      assistantGender: getAssistantGender(userContext.gender),
      model: getModelName(userContext.gender)
    });
  }, [userContext.gender]);

  // Temporary: Force set gender to male for testing - REMOVE AFTER TESTING
  useEffect(() => {
    console.log('Setting user gender to male for testing');
    updateUserContext({ gender: 'male' });
  }, []);

  // Initialize config with saved data or defaults
  const [config, setConfig] = useState<ChatConfig>(() => {
    const saved = storage.get<ChatConfig>('chatConfig', defaultConfig);
    const assistantName = getAssistantName(userContext.gender);
    const assistantGender = getAssistantGender(userContext.gender);
    
    return {
      ...defaultConfig,
      ...saved,
      assistantName,
      assistantGender,
    };
  });

  // Update config when user's gender changes
  useEffect(() => {
    const assistantName = getAssistantName(userContext.gender);
    const assistantGender = getAssistantGender(userContext.gender);
    
    // Only update if the values have actually changed
    if (
      config.assistantName !== assistantName ||
      config.assistantGender !== assistantGender
    ) {
      const newConfig = {
        ...config,
        assistantName,
        assistantGender,
      };
      
      setConfig(newConfig);
      storage.set('chatConfig', newConfig);
    }
  }, [userContext.gender]);

  // Add welcome message on first render
  useEffect(() => {
    if (messages.length === 0 && !isInitialized.current) {
      isInitialized.current = true;
      const assistantName = getAssistantName(userContext.gender);
      const welcomeMessage: Message = {
        id: uuidv4(),
        text: `Hi, I'm ${assistantName}. How can I help you today?`,
        sender: 'assistant',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, welcomeMessage]);
    }
  }, [userContext.gender]);

  // Toggle chat visibility
  const toggleChat = useCallback((forceState?: boolean) => {
    setIsOpen(prevState => {
      const newState = forceState !== undefined ? forceState : !prevState;
      storage.set('chatIsOpen', newState);
      return newState;
    });
  }, []);

  // Update user context
  const updateUserContext = useCallback((updates: Partial<UserContext>) => {
    setUserContext(prev => {
      const newContext = { ...prev, ...updates };
      storage.set('userContext', newContext);
      return newContext;
    });
  }, []);

  // Send message to the server
  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim()) return;

    console.log('Sending message with context:', {
      userGender: userContext.gender,
      model: getModelName(userContext.gender),
      assistantName: getAssistantName(userContext.gender)
    });

    const userMessage: Message = {
      id: uuidv4(),
      text,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsTyping(true);

    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5001'}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: text,
          gender: userContext.gender,
          mood: userContext.mood,
          model: getModelName(userContext.gender),
        }),
      });

      if (!response.ok) throw new Error('Network response was not ok');
      
      const data = await response.json();
      
      const responseMessage: Message = {
        id: uuidv4(),
        text: data.response,
        sender: 'assistant',
        timestamp: new Date(data.timestamp || Date.now()),
      };

      setMessages(prev => prev.map(msg => 
        msg.id === userMessage.id ? { ...msg, isProcessed: true } : msg
      ).concat(responseMessage));
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        id: uuidv4(),
        text: 'Sorry, I encountered an error. Please try again later.',
        sender: 'assistant',
        timestamp: new Date(),
        isError: true,
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  }, [userContext.gender, userContext.mood]);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    messages,
    sendMessage,
    isOpen,
    toggleChat,
    userContext,
    updateUserContext,
    config,
    quickReplies: defaultQuickReplies,
    isTyping,
  }), [messages, sendMessage, isOpen, userContext, config, isTyping]);

  return (
    <ChatContext.Provider value={contextValue}>
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

export default ChatContext;
