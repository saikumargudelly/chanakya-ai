import React, { useRef, useState, useCallback, memo, useEffect } from 'react';
import { motion, PanInfo, HTMLMotionProps, MotionStyle } from 'framer-motion';
import { useChat } from './context/ChatContext';

const DRAG_THRESHOLD = 5; // pixels to move before considering it a drag

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
  const { toggleChat, userContext } = useChat();
  const constraintsRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const shouldHandleClick = useRef(true);
  const clickTimer = useRef<NodeJS.Timeout | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Clean up timer on unmount
  useEffect(() => {
    const timer = clickTimer.current;
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, []);

  // Handle click with debounce to prevent accidental clicks after drag
  const handleClick = useCallback(() => {
    if (shouldHandleClick.current) {
      toggleChat();
    }
  }, [toggleChat]);

  // Handle pointer down to track drag start
  const handlePointerDown = useCallback(() => {
    shouldHandleClick.current = true;
    if (clickTimer.current) {
      clearTimeout(clickTimer.current);
    }
    clickTimer.current = setTimeout(() => {
      shouldHandleClick.current = false;
    }, 200);
  }, []);

  // Handle drag with framer-motion
  const handleDrag = useCallback((e: MouseEvent, info: PanInfo) => {
    if (!isDraggingRef.current) return;
    // Handle drag logic here using info.point.x and info.point.y
  }, []);

  // Handle drag start/end with framer-motion
  const handleDragStart = useCallback(() => {
    isDraggingRef.current = true;
    setIsDragging(true);
    shouldHandleClick.current = false;
    if (clickTimer.current) {
      clearTimeout(clickTimer.current);
      clickTimer.current = null;
    }
    onDragStart?.();
  }, [onDragStart]);

  const handleDragEnd = useCallback(() => {
    isDraggingRef.current = false;
    setIsDragging(false);
    setTimeout(() => {
      shouldHandleClick.current = true;
    }, 100);
    onDragEnd?.();
  }, [onDragEnd]);

  // Get avatar image based on user context
  const getAvatar = useCallback(() => {
    if (!userContext) return '/default-avatar.png';
    switch (userContext.gender) {
      case 'male': return '/avatars/krish.svg';
      case 'female': return '/avatars/rukmini.svg';
      default: return '/avatars/chanakya.svg';
    }
  }, [userContext]);

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
  
  const motionStyle: MotionStyle = {
    position: 'fixed',
    bottom: '20px',
    right: '20px',
    zIndex: 1000,
    userSelect: 'none',
    WebkitUserSelect: 'none',
    touchAction: 'pan-y',
    border: `3px solid ${isDragging ? '#8b5cf6' : getBorderColor()}`,
    boxShadow: isDragging 
      ? '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
      : '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'auto',
    display: 'flex'
  };
  
  return (
    <div ref={constraintsRef} className="fixed inset-0 pointer-events-none">
      <MotionDiv
        role="button"
        aria-label="Toggle chat"
        tabIndex={0}
        drag
        dragConstraints={constraintsRef}
        dragElastic={0.1}
        dragMomentum={false}
        initial={{ opacity: 0, y: 20 }}
        animate={{
          opacity: 1,
          y: 0,
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
        style={motionStyle}
        onPointerDown={handlePointerDown}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
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
