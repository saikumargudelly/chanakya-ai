import React, { useRef, useState, useCallback, memo, useEffect } from 'react';
import { motion, PanInfo } from 'framer-motion';
import { useChat } from './context/ChatContext';

const DRAG_THRESHOLD = 5; // pixels to move before considering it a drag

const Draggable = memo(() => {
  const { toggleChat, userContext } = useChat();
  const constraintsRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const shouldHandleClick = useRef(true);
  const clickTimer = useRef<NodeJS.Timeout | null>(null);

  // Clean up timer on unmount
  useEffect(() => {
    const timer = clickTimer.current;
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, []);

  // Handle click with debounce to prevent accidental clicks after drag
  const handleClick = useCallback((e: React.MouseEvent) => {
    if (!shouldHandleClick.current) return;

    // Debounce rapid clicks
    if (clickTimer.current) {
      clearTimeout(clickTimer.current);
    }

    clickTimer.current = setTimeout(() => {
      if (shouldHandleClick.current) {
        toggleChat();
      }
    }, 100);
  }, [toggleChat]);

  // Handle pointer down to track drag start
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    shouldHandleClick.current = true;
    isDraggingRef.current = false;

    const startX = e.clientX;
    const startY = e.clientY;

    const handlePointerMove = (moveEvent: PointerEvent) => {
      const dx = Math.abs(moveEvent.clientX - startX);
      const dy = Math.abs(moveEvent.clientY - startY);

      if (dx > DRAG_THRESHOLD || dy > DRAG_THRESHOLD) {
        isDraggingRef.current = true;
        shouldHandleClick.current = false;
      }
    };

    const handlePointerUp = () => {
      document.removeEventListener('pointermove', handlePointerMove);
      document.removeEventListener('pointerup', handlePointerUp);
    };

    document.addEventListener('pointermove', handlePointerMove);
    document.addEventListener('pointerup', handlePointerUp, { once: true });
  }, []);

  // Handle drag with framer-motion
  const handleDrag = useCallback((e: MouseEvent, info: PanInfo) => {
    if (!isDraggingRef.current) return;
    // Handle drag logic here using info.point.x and info.point.y
  }, []);

  // Handle drag start/end with framer-motion
  const handleDragStart = useCallback(() => {
    isDraggingRef.current = true;
    shouldHandleClick.current = false;
    if (clickTimer.current) {
      clearTimeout(clickTimer.current);
      clickTimer.current = null;
    }
  }, []);

  const handleDragEnd = useCallback(() => {
    isDraggingRef.current = false;
    setTimeout(() => {
      shouldHandleClick.current = true;
    }, 100);
  }, []);

  // Get avatar image based on user context
  const getAvatar = useCallback((): string => {
    if (!userContext) return '/avatars/chanakya.svg';
    if (userContext.gender === 'male') return '/avatars/krish.svg';
    if (userContext.gender === 'female') return '/avatars/rukmini.svg';
    return '/avatars/chanakya.svg';
  }, [userContext]);

  // Get mood border color
  const getBorderColor = useCallback((): string => {
    // Default border color
    return '#8b5cf6';
  }, []);

  // Get mood emoji
  const getEmoji = useCallback((): string => {
    // Default emoji
    return '😊';
  }, []);

  // Handle key down for accessibility
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggleChat();
    }
  }, [toggleChat]);
  
  const borderColor = getBorderColor();
  const avatar = getAvatar();
  const emoji = getEmoji();
  
  const motionProps = {
    initial: { opacity: 0, y: 20 },
    animate: {
      opacity: 1,
      y: 0,
      scale: 1,
      boxShadow: `0 0 0 0 ${borderColor}`
    },
    transition: {
      opacity: { duration: 0.3 },
      y: { type: 'spring', stiffness: 300, damping: 20 }
    },
    drag: true,
    dragConstraints: constraintsRef,
    dragElastic: 0.1,
    dragMomentum: false,
    onClick: handleClick,
    onPointerDown: handlePointerDown,
    onDragStart: handleDragStart,
    onDragEnd: handleDragEnd,
    whileHover: { scale: 1.1 },
    whileTap: { scale: 0.95 }
  };
  
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
        className={`chat-avatar fixed bottom-8 right-8 w-16 h-16 rounded-full bg-white shadow-2xl ${
          isDraggingRef.current ? 'cursor-grabbing' : 'cursor-pointer'
        }`}
        style={{
          userSelect: 'none',
          WebkitUserSelect: 'none',
          touchAction: 'pan-y',
          border: `3px solid ${isDraggingRef.current ? '#8b5cf6' : borderColor}`,
          boxShadow: isDraggingRef.current ? '0 0 15px rgba(139, 92, 246, 0.8)' : 'none',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'auto',
          display: 'flex' // Ensure flex layout for centering
        }}
        {...motionProps}
        onKeyDown={handleKeyDown}
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
