import React, { createContext, useContext, useState, useCallback, ReactNode, useMemo } from 'react';
import { Message, MoodType, ChatConfig, UserContext as UserContextType, ChatContextType } from '../types/chat';
import { useAuth } from '../components/AuthContext';
import api from '../services/api';

interface ChatApiResponse {
  response: string;
  timestamp: string;
}

const defaultConfig: ChatConfig = {
  isOpen: false,
  assistantName: '',
  assistantGender: 'neutral',
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
  
  const { user } = useAuth();

  const toggleChat = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);
  
  const { assistantGender, assistantName } = useMemo(() => {
    console.log('Computing assistant gender/name, user gender is:', user?.gender);
    const calculatedAssistantGender: 'male' | 'female' | 'neutral' = user?.gender === 'female' ? 'male' : (user?.gender === 'male' ? 'female' : 'neutral');
    const calculatedAssistantName = calculatedAssistantGender === 'male' ? 'Krishna' : (calculatedAssistantGender === 'female' ? 'Rukmini' : 'Assistant');
    return { assistantGender: calculatedAssistantGender, assistantName: calculatedAssistantName };
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
    name: user?.first_name || user?.email.split('@')[0] || 'User',
    gender: user?.gender === 'female' ? 'female' : (user?.gender === 'male' ? 'male' : 'neutral'),
  });
  }, [user]);

  const quickReplies = useMemo(() => defaultQuickReplies, []);

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
      const response: { data: ChatApiResponse } = await api.post('/chat', {
        user_id: user?.id,
        message: content,
        income: null,
        expenses: {},
        mood: mood,
        gender: user?.gender
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
