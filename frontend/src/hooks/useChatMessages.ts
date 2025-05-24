import { useState, useCallback } from 'react';
import { Message } from '../types/chat';
import { v4 as uuidv4 } from 'uuid';

export const useChatMessages = (initialMessages: Message[] = []) => {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [isTyping, setIsTyping] = useState(false);

  const addMessage = useCallback((message: Omit<Message, 'id' | 'timestamp' | 'sender'>, isUser = false) => {
    const newMessage: Message = {
      ...message,
      id: uuidv4(),
      timestamp: new Date(),
      sender: isUser ? 'user' : 'assistant',
    };
    
    setMessages(prev => [...prev, newMessage]);
    return newMessage;
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  return {
    messages,
    isTyping,
    setIsTyping,
    addMessage,
    clearMessages,
  };
};
