import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef, ReactNode } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Message, UserContext, ChatConfig, Gender, QuickReply, MoodType, UserContext as UserContextType, ChatContextType, ChatApiResponse } from '../types/chat';
import { storage } from '../../../utils/storage';
import { useAuth } from '../../../components/AuthContext';
import api from '../../../services/api';

// ===== Helper Functions =====
type AssistantGender = 'male' | 'female' | 'other';

// Map user gender to assistant's characteristics
const getAssistantConfig = (userGender: Gender | null | undefined): { 
  gender: AssistantGender; 
  name: string; 
  model: string 
} => {
  if (!userGender || userGender === 'other') {
    return { gender: 'other', name: 'Chanakya', model: 'chanakya' };
  }
  if (userGender === 'male') {
    return { gender: 'female', name: 'Rukmini', model: 'rukhmini' };
  }
  // For female users
  return { gender: 'male', name: 'Krishna', model: 'krishna' };
};

// Backward compatibility functions
const getAssistantName = (userGender: Gender): string => 
  getAssistantConfig(userGender).name;

const getAssistantGender = (userGender: Gender): AssistantGender => 
  getAssistantConfig(userGender).gender;

const getModelName = (userGender: Gender): string => 
  getAssistantConfig(userGender).model;

// ===== Default Values =====
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
  { id: '2', text: 'How does this work?', emoji: '❓', payload: 'how_it_works' },
  { id: '3', text: 'Thanks!', emoji: '🙏', payload: 'thanks' },
];

// ===== Context Types =====

interface ChatProviderProps {
  children: ReactNode;
  userName?: string;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

// ===== Main Provider Component =====
export const ChatProvider: React.FC<ChatProviderProps> = ({ children, userName }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [mood, setMood] = useState<MoodType>('neutral');
  const [isOpen, setIsOpen] = useState(false);
  
  const { user } = useAuth();

  const toggleChat = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);
  
  // Add initial greeting message when chat opens and messages are empty
  useEffect(() => {
    console.log('User context updated in ChatDrawer:', { 
      userContext,
      user: user,
      timestamp: new Date().toISOString()
    });
    
    if (userContext?.mood) {
      // Explicitly cast to MoodType to see if it resolves the type error
      const moodToSet: MoodType = userContext.mood as MoodType;
      setMood(moodToSet);
    }

    if (isOpen && messages.length === 0 && user?.first_name) {
      const initialMessage: Message = {
        id: Date.now().toString() + '_greeting',
        text: `Hi ${user.first_name}, how are you?`,
        sender: 'assistant',
        timestamp: new Date(),
        mood: 'neutral', // Or a happy mood?
      };
      setMessages([initialMessage]);
    }
  }, [isOpen, messages.length, user?.first_name]); // Depend on isOpen, messages length, and user first name
  
  // Determine assistant configuration based on user gender whenever user changes
  const { assistantGender, assistantName } = useMemo(() => {
    // Log detailed user info for debugging
    console.log('Computing assistant config, user data:', {
      userId: user?.id,
      userGender: user?.gender,
      userName: user?.name,
      userEmail: user?.email,
      userFullData: user
    });
    
    // Get the config based on user's gender
    const config = getAssistantConfig(user?.gender);
    
    console.log('Computed assistant config:', {
      config,
      userGender: user?.gender,
      timestamp: new Date().toISOString()
    });
    
    return { 
      assistantGender: config.gender, 
      assistantName: config.name 
    };
  }, [user]);

  const config: ChatConfig = useMemo(() => ({
    ...defaultConfig,
    assistantName,
    assistantGender,
  }), [assistantName, assistantGender]);
  
  const userContext: UserContextType = useMemo(() => {
    console.log('Computing userContext, user gender is:', user?.gender);
    return ({
      ...defaultUserContext,
      name: userName || user?.first_name || user?.email?.split('@')[0] || 'User',
      gender: user?.gender || 'other',
    });
  }, [user, userName]);

  const quickReplies = useMemo(() => defaultQuickReplies, []);

  const updateUserContext = useCallback((updates: Partial<UserContextType>) => {
    // Since we're using the user from AuthContext, we don't need to update the context
    console.log('updateUserContext called with updates:', updates);
  }, []);

  const sendMessage = useCallback(async (content: string) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      text: content,
      sender: 'user',
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, newMessage]);
    
    setIsTyping(true);
    
    try {
      console.log('Sending user gender to backend:', user?.gender);
      const model = getModelName(user?.gender as Gender);
      console.log('Using model:', model);
      
      // Get user timezone
      const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      console.log('Sending user timezone to backend:', userTimezone);

      const response: { data: ChatApiResponse } = await api.post('/api/chat', {
        user_id: user?.id,
        message: content,
        income: null,
        expenses: {},
        mood: mood,
        gender: user?.gender,
        model: model,
        timezone: userTimezone, // Include timezone in the request
      });

      const assistantResponseText = response.data.response || 'Error: Could not get a response.';

      const assistantMessage: Message = {
        id: Date.now().toString() + '_bot',
        text: assistantResponseText,
        sender: 'assistant',
        timestamp: new Date(),
        mood: 'neutral',
      };
      setMessages(prev => [...prev, assistantMessage]);

    } catch (error) {
      console.error('Error sending message to backend:', error);
      const errorMessage: Message = {
        id: Date.now().toString() + '_error',
        text: 'Sorry, I am having trouble connecting right now. Please try again later.',
        sender: 'assistant',
        timestamp: new Date(),
        isError: true,
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }

  }, [user, mood]);

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
    updateUserContext,
  }), [messages, isTyping, mood, sendMessage, isOpen, toggleChat, config, quickReplies, userContext, updateUserContext]);

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

export default ChatContext;
