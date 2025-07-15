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
import api from '../../../../services/api/api';

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

// API service using axios
const apiService: ApiService = {
  async post<T = ChatApiResponse>(url: string, data: any): Promise<{ data: T }> {
    const response = await api.post(url, data);
    return { data: response.data };
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
  if (userGender === 'female') {
    // Female users get Krishna (male assistant)
    return { gender: 'male', name: 'Krishna', model: 'krishna' };
  }
  // Male users get Rukmini (female assistant)
  return { gender: 'female', name: 'Rukmini', model: 'rukmini' };
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
  userGender?: 'male' | 'female' | 'other';
}

// Create context with undefined default value
const ChatContext = createContext<ChatContextType | undefined>(undefined);

// Main Provider Component
const ChatProvider: React.FC<ChatProviderProps> = ({ children, userName, userGender: userGenderProp }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [mood, setMood] = useState<MoodType>('neutral');
  const [isOpen, setIsOpen] = useState(false);
  const [quickReplies, setQuickReplies] = useState<QuickReply[]>(defaultQuickReplies);
  
  const { user } = useAuth() as { user: AuthUser | null };
  
  // Debug log for user.gender
  console.log('ChatProvider - user.gender:', user?.gender);
  
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
  
  // Log the current user data whenever it changes
  useEffect(() => {
    console.log('ChatContext - Current user data:', {
      user: {
        ...user,
        // Don't log sensitive data
        email: user?.email ? '[REDACTED]' : undefined,
      },
      userGenderProp,
      timestamp: new Date().toISOString()
    });
  }, [user, userGenderProp]);

  // Determine assistant configuration based on user gender
  const { assistantGender, assistantName, model } = useMemo(() => {
    // Use the prop if available, otherwise fall back to the user's gender from auth
    const userGender = userGenderProp || user?.gender || 'other';
    
    console.log('Determining assistant config with gender:', { 
      userGender, 
      userGenderProp, 
      userGenderFromAuth: user?.gender,
      source: userGenderProp ? 'prop' : user?.gender ? 'auth' : 'default',
      timestamp: new Date().toISOString()
    });
    
    const config = getAssistantConfig(userGender);
    
    console.log('Assistant config determined:', {
      userGender,
      assistantName: config.name,
      assistantGender: config.gender,
      model: config.model,
      timestamp: new Date().toISOString()
    });
    
    return { 
      assistantGender: config.gender, 
      assistantName: config.name,
      model: config.model
    };
  }, [user?.gender, userGenderProp]);

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
      // Prepare API request with proper gender handling
      const userGender = user?.gender?.toLowerCase() || 'other';
      const validGenders = ['male', 'female', 'other'];
      const sanitizedGender = validGenders.includes(userGender) ? userGender : 'other';
      
      console.log('User gender for API request:', {
        rawGender: user?.gender,
        sanitizedGender,
        userId: user?.id,
        hasUser: !!user
      });
      
      const requestData = {
        user_id: user?.id || 'anonymous',
        message: content,
        mood,
        gender: sanitizedGender,
        model: model || 'chanakya',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      };
      
      // Enhanced API call with detailed logging
      let attempts = 0;
      const maxAttempts = 3;
      let response;
      let lastError: Error | null = null;
      
      // Log the request data
      console.log('Sending request to /chat with data:', JSON.stringify(requestData, null, 2));
      
      while (attempts < maxAttempts) {
        try {
          const url = '/chat';
          console.log(`Attempt ${attempts + 1}/${maxAttempts} - Calling ${url}`);
          const startTime = Date.now();
          response = await apiService.post(url, requestData);
          const responseTime = Date.now() - startTime;
          console.log(`API call completed in ${responseTime}ms with status:`, response.status);
          // Use response.data directly
          const responseData = response.data;
          console.log('API response data:', responseData);
          if (!responseData) {
            console.error('Empty response data from server');
            throw new Error('Empty response data from server');
          }
          // Handle different response formats
          let responseText: string;
          if (typeof responseData === 'string') {
            responseText = responseData;
          } else if (responseData && typeof responseData === 'object') {
            responseText = responseData.response || 
                         responseData.message || 
                         responseData.text ||
                         JSON.stringify(responseData);
          } else {
            responseText = String(responseData);
          }
          console.log('Extracted response text:', responseText);
          if (!responseText) {
            console.error('Failed to extract response text from:', responseData);
            throw new Error('Empty response text from server');
          }
          // Handle potential HTML/markdown in response
          if (typeof responseText === 'string' && (responseText.includes('<') || responseText.includes('`'))) {
            responseText = responseText
              .replace(/<[^>]*>/g, '')
              .replace(/```[\s\S]*?```/g, '')
              .replace(/`([^`]*)`/g, '$1')
              .replace(/\n\s*\n/g, '\n')
              .trim();
          }
          const assistantMessage: Message = {
            id: Date.now().toString(),
            text: responseText || 'I apologize, but I encountered an issue processing your request.',
            sender: 'assistant',
            timestamp: new Date(),
            mood: responseData.mood || 'neutral',
            model: responseData.model,
          };
          setMessages(prev => [...prev, assistantMessage]);
          if (responseData.quickReplies) {
            setQuickReplies(responseData.quickReplies);
          }
          if (responseData.mood) {
            setMood(responseData.mood);
          }
          break; // If successful, exit the retry loop
        } catch (error) {
          lastError = error as Error;
          console.error(`Attempt ${attempts + 1} failed:`, error);
          attempts++;
          if (attempts === maxAttempts) {
            console.error('All attempts failed');
            throw new Error(`Failed after ${maxAttempts} attempts: ${lastError.message}`);
          }
          const delay = 1000 * attempts;
          console.log(`Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
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
