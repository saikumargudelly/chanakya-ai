import { useState, useCallback } from 'react';

export const useChatUI = (initialState = false) => {
  const [isOpen, setIsOpen] = useState(initialState);

  const toggleChat = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);

  const openChat = useCallback(() => {
    setIsOpen(true);
  }, []);

  const closeChat = useCallback(() => {
    setIsOpen(false);
  }, []);

  return {
    isOpen,
    toggleChat,
    openChat,
    closeChat,
  };
};
