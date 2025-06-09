import * as React from 'react';
import { ChatProvider, useChat } from './context/ChatContext';
import ChatDrawer from './ChatDrawer';
import Draggable from './Draggable';
import { AuthProvider, useAuth } from '../../contexts/AuthContext';

// Dark mode hook
const useDarkMode = () => {
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
  
  return isDarkMode;
};

// Main component that uses the chat context
const RukminiChatContent: React.FC = () => {
  console.log('Rendering RukminiChatContent');
  const isDarkMode = useDarkMode();
  const { user } = useAuth();
  
  // Log user info for debugging
  React.useEffect(() => {
    console.log('Current user in RukminiChatContent:', user);
  }, [user]);
  
  return (
    <>
      <Draggable>
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-bold">
          <span className="text-2xl">🧙</span>
        </div>
      </Draggable>
      <ChatDrawer />
    </>
  );
};

// Define props for the RukminiChat component
interface RukminiChatProps {
  userName?: string;
}

// ChatContent component that uses the chat context
const ChatContent: React.FC = () => {
  const chat = useChat();
  const { isOpen } = chat;
  
  // Debug log chat context
  React.useEffect(() => {
    console.log('Chat context in ChatContent:', {
      isOpen,
      hasToggleChat: !!chat.toggleChat,
      userContext: chat.userContext
    });
  }, [chat, isOpen]);
  
  return <RukminiChatContent />;
};

// Provider wrapper component
const RukminiChat: React.FC<RukminiChatProps> = ({
  userName = 'Friend'
}) => {
  console.log('Rendering RukminiChat with props:', { userName });
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
    <AuthProvider>
      <ChatProvider 
        key="chat-provider"
        userName={userName}
      >
        <ChatContent />
      </ChatProvider>
    </AuthProvider>
  ), [userName]);
};

export { RukminiChat };
export default RukminiChat;
