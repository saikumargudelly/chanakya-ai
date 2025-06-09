import React from 'react';
import { ChatProvider } from './context/ChatContext';
import { ChatDrawer } from './components/ChatDrawer';
import { Draggable } from './components/Draggable';

const GoalMasterChat: React.FC = () => {
  return (
    <ChatProvider>
      <Draggable />
      <ChatDrawer />
    </ChatProvider>
  );
};

export { GoalMasterChat };
export default GoalMasterChat; 