import React, { useRef, useState, useCallback, memo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useChat } from './context/ChatContext';

const Draggable = memo(() => {
  const { toggleChat, userContext } = useChat();
  const constraintsRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  
  // Memoize avatar image based on user context
  const avatarImage = useCallback(() => {
    if (!userContext) return '/avatars/chanakya.svg';
    if (userContext.gender === 'male') return '/avatars/krish.svg';
    if (userContext.gender === 'female') return '/avatars/rukmini.svg';
    return '/avatars/chanakya.svg';
  }, [userContext?.gender]);
  
  // Memoize mood border color
  const moodBorderColor = useCallback(() => {
    if (!userContext) return '#8b5cf6';
    switch (userContext.mood) {
      case 'happy': return '#f59e0b';
      case 'stressed': return '#ef4444';
      case 'calm': return '#3b82f6';
      default: return '#8b5cf6';
    }
  }, [userContext?.mood]);

  // Memoize mood emoji
  const moodEmoji = useCallback(() => {
    if (!userContext) return '😐';
    switch (userContext.mood) {
      case 'happy': return '😊';
      case 'stressed': return '😫';
      case 'calm': return '😌';
      default: return '😐';
    }
  }, [userContext?.mood]);

  const [isDraggingState, setIsDraggingState] = useState(false);
  const clickTimer = useRef<NodeJS.Timeout | null>(null);
  const isClick = useRef(true);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    isClick.current = true;
    
    // Set a timer to handle the click after a short delay
    clickTimer.current = setTimeout(() => {
      if (isClick.current && toggleChat) {
        toggleChat();
      }
    }, 100);
  }, [toggleChat]);

  const handleDragStart = useCallback(() => {
    // Mark as not a click when drag starts
    isClick.current = false;
    if (clickTimer.current) {
      clearTimeout(clickTimer.current);
    }
    setIsDraggingState(true);
  }, []);

  const handleDragEnd = useCallback(() => {
    setIsDraggingState(false);
  }, []);
  
  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (clickTimer.current) {
        clearTimeout(clickTimer.current);
      }
    };
  }, []);

  // Handle key down for accessibility
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (toggleChat) {
        toggleChat();
      }
    }
  }, [toggleChat]);
  
  const borderColor = moodBorderColor();
  const avatar = avatarImage();
  const emoji = moodEmoji();
  
  const motionProps = {
    initial: { opacity: 0, y: 20 },
    animate: {
      opacity: 1,
      y: 0,
      scale: [1, 1.05, 1],
      boxShadow: [
        `0 0 0 0 ${borderColor}`,
        `0 0 0 10px ${borderColor}40`,
        `0 0 0 0 ${borderColor}00`
      ]
    },
    transition: {
      duration: 2,
      repeat: Infinity,
      repeatType: 'loop',
      ease: 'easeInOut',
      opacity: { duration: 0.3 },
      y: { type: 'spring', stiffness: 300, damping: 20 },
      scale: { duration: 2, repeat: Infinity, ease: 'easeInOut' },
      boxShadow: { duration: 2, repeat: Infinity, ease: 'easeInOut' }
    },
    drag: true,
    dragConstraints: constraintsRef,
    dragElastic: 0.1,
    dragMomentum: false,
    onPointerDown: handlePointerDown,
    onDragStart: handleDragStart,
    onDragEnd: handleDragEnd,
    onKeyDown: handleKeyDown,
    whileHover: { scale: 1.1 },
    whileTap: { scale: 0.95 }
  } as const;
  
  return (
    <div 
      ref={constraintsRef} 
      className="fixed inset-0 overflow-hidden pointer-events-none"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999,
      }}
    >
      <motion.div
        role="button"
        aria-label="Toggle chat"
        tabIndex={0}
        onKeyDown={handleKeyDown}
        className={`chat-avatar fixed bottom-8 right-8 w-16 h-16 rounded-full bg-white shadow-2xl ${
          isDraggingState ? 'cursor-grabbing' : 'cursor-pointer'
        }`}
        style={{
          userSelect: 'none',
          WebkitUserSelect: 'none',
          touchAction: 'pan-y',
          border: `3px solid ${isDraggingState ? '#8b5cf6' : moodBorderColor()}`,
          boxShadow: isDraggingState ? '0 0 15px rgba(139, 92, 246, 0.8)' : 'none',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'auto'
        }}
        {...motionProps}
      >
        <div className="w-12 h-12 rounded-full overflow-hidden">
          <img
            src={avatar}
            alt="Avatar"
            className="w-full h-full object-cover"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.onerror = null;
              target.src = 'https://via.placeholder.com/64';
            }}
            draggable={false}
          />
        </div>
        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-white rounded-full flex items-center justify-center border-2 border-white">
          <span className="text-xs">{emoji}</span>
        </div>
      </motion.div>
    </div>
  );
});

Draggable.displayName = 'Draggable';

export default Draggable;
