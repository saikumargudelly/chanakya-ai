import { useRef, useState, useCallback, memo } from 'react';
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

  // Memoize drag handlers
  const handleDragStart = useCallback(() => {
    setIsDragging(true);
  }, []);

  const handleDragEnd = useCallback(() => {
    // Small delay to prevent accidental clicks after drag
    setTimeout(() => setIsDragging(false), 100);
  }, []);

  // Track if the mouse was moved during mousedown
  const mouseMoved = useRef(false);
  const mouseDownTime = useRef(0);
  
  // Handle mouse down
  const handleMouseDown = useCallback(() => {
    mouseMoved.current = false;
    mouseDownTime.current = Date.now();
  }, []);
  
  // Handle mouse move during drag
  const handleMouseMove = useCallback(() => {
    if (!mouseMoved.current) {
      mouseMoved.current = true;
    }
  }, []);
  
  // Memoize click handler
  const handleClick = useCallback((e: React.MouseEvent | React.KeyboardEvent) => {
    e.stopPropagation();
    e.preventDefault();
    
    // Only toggle chat if it's a keyboard event or a click (not a drag)
    if (e.type === 'keydown' || (!mouseMoved.current && (Date.now() - mouseDownTime.current) < 200)) {
      if (toggleChat) {
        console.log('Toggling chat from Draggable');
        toggleChat();
      }
    }
  }, [toggleChat]);

  // Memoize key down handler for accessibility
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      handleClick(e);
    }
  }, [handleClick]);
  
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
    onDragStart: () => {
      handleDragStart();
      handleMouseMove();
    },
    onDragEnd: handleDragEnd,
    onMouseDown: handleMouseDown,
    onMouseMove: handleMouseMove,
    onPointerDown: (e: React.PointerEvent) => {
      e.stopPropagation();
      handleMouseDown();
    },
    onPointerMove: (e: React.PointerEvent) => {
      e.stopPropagation();
      handleMouseMove();
    },
    onPointerUp: (e: React.PointerEvent) => {
      e.stopPropagation();
      if (!mouseMoved.current) {
        handleClick(e as any);
      }
    },
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
          isDragging ? 'cursor-grabbing' : 'cursor-pointer'
        }`}
        style={{
          userSelect: 'none',
          WebkitUserSelect: 'none',
          touchAction: 'pan-y',
          border: `2px solid ${borderColor}`,
          zIndex: 2147483647,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: `0 0 0 0 ${borderColor}`,
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
