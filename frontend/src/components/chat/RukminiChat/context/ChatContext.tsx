import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import { 
  Message, 
  ChatConfig, 
  Gender, 
  QuickReply, 
  MoodType, 
  UserContext as UserContextType, 
  ChatContextType, 
  ChatApiResponse, 
  User 
} from '../../../../types/chat';
import { useAuth } from '../../../../context/AuthContext';

// Extend the User type to include auth-specific properties
interface AuthUser extends User {
  id: string;
  email: string;
  name: string;
  gender: Gender;
}

// Define API interface
interface ApiService {
  post<T = ChatApiResponse>(url: string, data: any): Promise<{ data: T }>;
}

// Mock API service - replace with actual API import
const api: ApiService = {
  async post<T = ChatApiResponse>(): Promise<{ data: T }> {
    // This is a mock implementation
    const mockResponse: ChatApiResponse = { 
      response: 'Welcome to Chanakya AI! How can I help you today?',
      mood: 'neutral',
      quickReplies: []
    };
    return {
      data: mockResponse as unknown as T
    };
  }
};

// Type for assistant configuration
interface AssistantConfig {
  gender: Gender;
  name: string;
  model: string;
}

// Get assistant config based on user gender
const getAssistantConfig = (userGender: Gender | null | undefined): AssistantConfig => {
  if (!userGender || userGender === 'other') {
    return { gender: 'other', name: 'Chanakya', model: 'chanakya' };
  }
  if (userGender === 'male') {
    return { gender: 'female', name: 'Rukmini', model: 'rukhmini' };
  }
  return { gender: 'male', name: 'Krishna', model: 'krishna' };
};

// Default values
const defaultUserContext: UserContextType = {
  name: 'User',
  gender: 'other',
  mood: 'neutral',
  wisdomLevel: 1,
  xp: 0,
};

const defaultConfig: ChatConfig = {
  isOpen: false,
  assistantName: '',
  assistantGender: 'other',
  theme: {
    primary: '#4f46e5',
    secondary: '#7c3aed',
    background: '#ffffff',
    text: '#1f2937'
  }
};

const defaultQuickReplies: QuickReply[] = [
  { id: '1', text: 'Tell me more', emoji: '💭', payload: 'tell_me_more' },
  { id: '2', text: 'That\'s helpful', emoji: '👍', payload: 'thats_helpful' },
  { id: '3', text: 'Thanks!', emoji: '🙏', payload: 'thanks' },
];

interface ChatProviderProps {
  children: ReactNode;
  userName?: string;
}

// Create context with undefined default value
const ChatContext = createContext<ChatContextType | undefined>(undefined);

// Main Provider Component
const ChatProvider: React.FC<ChatProviderProps> = ({ children, userName }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [mood, setMood] = useState<MoodType>('neutral');
  const [isOpen, setIsOpen] = useState(false);
  const [quickReplies, setQuickReplies] = useState<QuickReply[]>(defaultQuickReplies);
  
  const { user } = useAuth() as { user: AuthUser | null };
  
  // Add initial greeting message when chat opens and messages are empty
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const greeting = user?.name 
        ? `Hi ${user.name}, I'm your financial coach. How can I help you today?`
        : 'Hello! I\'m your financial coach. How can I help you today?';
      
      const initialMessage: Message = {
        id: `${Date.now()}_greeting`,
        text: greeting,
        sender: 'assistant',
        timestamp: new Date(),
        mood: 'neutral',
      };
      setMessages([initialMessage]);
    }
  }, [isOpen, messages.length, user?.name]);
  
  // Determine assistant configuration based on user gender
  const { assistantGender, assistantName, model } = useMemo(() => {
    const userGender = user?.gender || 'other';
    const config = getAssistantConfig(userGender);
    return { 
      assistantGender: config.gender, 
      assistantName: config.name,
      model: config.model
    };
  }, [user?.gender]);

  // Chat configuration
  const config: ChatConfig = useMemo(() => ({
    ...defaultConfig,
    assistantName,
    assistantGender,
  }), [assistantName, assistantGender]);
  
  // User context with fallbacks
  const userContext: UserContextType = useMemo(() => ({
    ...defaultUserContext,
    name: userName || user?.name || 'User',
    gender: user?.gender || 'other',
  }), [user, userName]);

  // Update user context (delegates to auth provider)
  const updateUserContext = useCallback((updates: Partial<UserContextType>) => {
    console.log('User context updates should be handled by the auth provider:', updates);
  }, []);

  // Toggle chat visibility
  const toggleChat = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);

  // Send message to chat API
  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim()) return;

    // Create user message
    const userMessage: Message = {
      id: Date.now().toString(),
      text: content,
      sender: 'user',
      timestamp: new Date(),
    };
    
    // Add user message to chat
    setMessages(prev => [...prev, userMessage]);
    setIsTyping(true);
    
    try {
      // Prepare API request
      const requestData = {
        userId: user?.id,
        message: content,
        mood,
        gender: user?.gender || 'other',
        model,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      };
      
      // Call chat API
      const response = await api.post<ChatApiResponse>('/api/chat', requestData);

      // Create assistant message from response
      const assistantMessage: Message = {
        id: Date.now().toString(),
        text: response.data.response || 'I apologize, but I encountered an issue processing your request.',
        sender: 'assistant',
        timestamp: new Date(),
        mood: response.data.mood || 'neutral',
      };

      // Update state with assistant's response
      setMessages(prev => [...prev, assistantMessage]);
      
      // Update quick replies if provided
      if (response.data.quickReplies) {
        setQuickReplies(response.data.quickReplies);
      }
      
      // Update mood if changed
      if (response.data.mood) {
        setMood(response.data.mood);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Show error message to user
      const errorMessage: Message = {
        id: Date.now().toString(),
        text: 'Sorry, I encountered an error. Please try again.',
        sender: 'assistant',
        timestamp: new Date(),
        isError: true,
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  }, [mood, user?.id, user?.gender, model]);

  // Context value
  const contextValue = useMemo<ChatContextType>(() => ({
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
    updateUserContext,
  }), [
    messages,
    isTyping,
    mood,
    sendMessage,
    isOpen,
    config,
    quickReplies,
    userContext,
    updateUserContext,
    toggleChat,
  ]);

  return (
    <ChatContext.Provider value={contextValue}>
      {children}
    </ChatContext.Provider>
  );
};

// Custom hook for using chat context
const useChat = (): ChatContextType => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};

export { ChatProvider, useChat };
export default ChatContext;
