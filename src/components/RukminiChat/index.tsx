import React, { useEffect } from 'react';
import { ChatProvider, useChat } from './context/ChatContext';
import { ChatDrawer } from './components/ChatDrawer';
import { useTheme } from 'next-themes';
import Draggable from './components/Draggable';

// Main component that uses the chat context
const RukminiChatContent: React.FC = () => {
  const { isOpen } = useChat();
  const { theme } = useTheme();

  // Apply dark/light mode to the document
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  return (
    <>
      <Draggable />
      {isOpen && <ChatDrawer />}
    </>
  );
};

// Provider wrapper component
export const RukminiChat: React.FC = () => {
  return (
    <ChatProvider>
      <RukminiChatContent />
    </ChatProvider>
  );
};

export default RukminiChat;
