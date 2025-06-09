import React, { useRef, useState, useCallback, memo } from 'react';
import { motion } from 'framer-motion';
import { useChat } from './context';

// Create type-safe motion component using type assertion
const MotionDiv = motion.div as React.ComponentType<any>;

interface DraggableProps {
  children: React.ReactNode;
  onDragStart?: () => void;
  onDragEnd?: () => void;
  borderColor?: string;
}

export const Draggable: React.FC<DraggableProps> = ({
  children,
  onDragStart,
  onDragEnd,
  borderColor = '#e5e7eb'
}) => {
  const { toggleChat, userContext, config } = useChat();
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Handle click
  const handleClick = useCallback(() => {
    if (!isDragging) {
      toggleChat();
    }
  }, [toggleChat, isDragging]);

  // Get avatar image based on user context
  const getAvatar = useCallback(() => {
    // Determine avatar based on assistant gender
    // Show Rukmini for male users, Krishna for female users, and Chanakya for others
    console.log('Draggable: Computing avatar for assistant gender:', config?.assistantGender);
    if (!config || !config.assistantGender) return '/avatars/chanakya.svg';
    switch (config.assistantGender) {
      case 'male': return '/avatars/rukmini.svg';
      case 'female': return '/avatars/krish.svg';
      default: return '/avatars/chanakya.svg';
    }
  }, [config]);

  // Get mood border color
  const getBorderColor = useCallback(() => {
    if (!userContext) return '#e5e7eb';
    switch (userContext.mood) {
      case 'happy': return '#fbbf24';
      case 'excited': return '#f472b6';
      case 'stressed': return '#f87171';
      case 'calm': return '#60a5fa';
      default: return '#e5e7eb';
    }
  }, [userContext]);

  // Get mood emoji
  const getEmoji = useCallback(() => {
    if (!userContext) return '😊';
    switch (userContext.mood) {
      case 'happy': return '😊';
      case 'excited': return '🤩';
      case 'stressed': return '😫';
      case 'calm': return '😌';
      default: return '😊';
    }
  }, [userContext]);

  // Handle key down for accessibility
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggleChat();
    }
  }, [toggleChat]);
  
  return (
    <div ref={containerRef} className="fixed inset-0 pointer-events-none">
      <MotionDiv
        role="button"
        aria-label="Toggle chat"
        tabIndex={0}
        drag
        dragMomentum={false}
        dragElastic={0}
        dragConstraints={containerRef}
        style={{
          position: 'fixed',
          bottom: '2rem',
          right: '2rem',
          zIndex: 1000,
          userSelect: 'none',
          WebkitUserSelect: 'none',
          touchAction: 'none',
          border: `3px solid ${isDragging ? '#8b5cf6' : getBorderColor()}`,
          boxShadow: isDragging 
            ? '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
            : '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'auto',
          display: 'flex'
        }}
        initial={{ opacity: 0 }}
        animate={{
          opacity: 1,
          scale: isDragging ? 1.05 : 1
        }}
        transition={{
          type: 'spring',
          stiffness: 300,
          damping: 30
        }}
        className={`chat-avatar w-16 h-16 rounded-full bg-white shadow-2xl ${
          isDragging ? 'cursor-grabbing' : 'cursor-pointer'
        }`}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        onDragStart={() => {
          setIsDragging(true);
          onDragStart?.();
        }}
        onDragEnd={() => {
          setIsDragging(false);
          onDragEnd?.();
        }}
      >
        <div className="w-12 h-12 rounded-full overflow-hidden">
          <img
            src={getAvatar()}
            alt="Avatar"
            className="w-full h-full object-cover"
          />
        </div>
        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-white rounded-full flex items-center justify-center border-2 border-white">
          <span className="text-xs">{getEmoji()}</span>
        </div>
      </MotionDiv>
    </div>
  );
};

Draggable.displayName = 'Draggable';

export default Draggable;
