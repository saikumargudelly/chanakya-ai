import * as React from 'react';
import { ChatProvider, useChat } from './context/ChatContext';
import ChatDrawer from './ChatDrawer';
import Draggable from './Draggable';
import { Gender } from './types';

// Main component that uses the chat context
const RukminiChatContent: React.FC = () => {
  console.log('Rendering RukminiChatContent');
  const chat = useChat();
  const { isOpen } = chat;
  
  // Debug log chat context
  console.log('Chat context in RukminiChatContent:', {
    isOpen,
    hasToggleChat: !!chat.toggleChat,
    userContext: chat.userContext
  });
  
  // Use system preference for dark mode
  const [isDarkMode, setIsDarkMode] = React.useState(false);
  
  React.useEffect(() => {
    // Check system preference
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => setIsDarkMode(mediaQuery.matches);
    
    // Set initial value
    setIsDarkMode(mediaQuery.matches);
    
    // Listen for changes
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);
  
  // Apply dark/light mode to the document
  React.useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  return (
    <>
      <Draggable />
      <ChatDrawer />
    </>
  );
};

// Define props for the RukminiChat component
interface RukminiChatProps {
  defaultGender?: Gender;
  userName?: string;
}

// Provider wrapper component
const RukminiChat: React.FC<RukminiChatProps> = ({
  defaultGender = 'neutral' as Gender,
  userName = 'Friend'
}) => {
  console.log('Rendering RukminiChat with props:', { defaultGender, userName });
  const isMounted = React.useRef(false);
  
  React.useEffect(() => {
    if (!isMounted.current) {
      isMounted.current = true;
      console.log('RukminiChat mounted');
    }
    
    return () => {
      console.log('RukminiChat cleanup');
    };
  }, []);
  
  // Only render the ChatProvider once
  return React.useMemo(() => (
    <ChatProvider 
      key="chat-provider"
      defaultGender={defaultGender}
      userName={userName}
    >
      <RukminiChatContent />
    </ChatProvider>
  ), [defaultGender, userName]);
};

export { RukminiChat };
export default RukminiChat;
