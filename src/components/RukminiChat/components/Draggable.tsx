import React, { useState, useEffect, useRef } from 'react';
import { motion, useDragControls } from 'framer-motion';
import { useChat } from '../context/ChatContext';

const Draggable: React.FC = () => {
  const { toggleChat, config, userContext } = useChat();
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const constraintsRef = useRef<HTMLDivElement>(null);
  const dragControls = useDragControls();
  const avatarRef = useRef<HTMLDivElement>(null);

  // Set initial position on mount and handle window resize
  useEffect(() => {
    const updatePosition = () => {
      if (avatarRef.current) {
        setPosition({
          x: window.innerWidth - 80, // 64px (w-16) + 16px (margin)
          y: window.innerHeight - 80  // 64px (h-16) + 16px (margin)
        });
      }
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    return () => window.removeEventListener('resize', updatePosition);
  }, []);

  const getMoodBorder = () => {
    switch (userContext.mood) {
      case 'happy': return 'border-yellow-400';
      case 'stressed': return 'border-red-400';
      case 'calm': return 'border-blue-400';
      default: return 'border-purple-400';
    }
  };

  const getAvatarImage = () => {
    if (config.assistantGender === 'male') return '/avatars/krish.png';
    if (config.assistantGender === 'female') return '/avatars/rukmini.png';
    return '/avatars/chanakya.png';
  };

  const handleDragStart = () => {
    setIsDragging(true);
  };

  const handleDragEnd = (event: any, info: any) => {
    setIsDragging(false);
    
    // Check for click (minimal movement)
    if (Math.abs(info.offset.x) < 5 && Math.abs(info.offset.y) < 5) {
      toggleChat();
    }
  };

  return (
    <div ref={constraintsRef} className="fixed inset-0 overflow-hidden pointer-events-none">
      <motion.div
        ref={avatarRef}
        className={`w-16 h-16 rounded-full bg-white shadow-xl cursor-grab ${
          isDragging ? 'cursor-grabbing' : ''
        } ${getMoodBorder()}`}
        style={{
          position: 'fixed',
          left: position.x,
          top: position.y,
          userSelect: 'none',
          WebkitUserSelect: 'none',
          touchAction: 'none',
          borderWidth: '2px',
          borderStyle: 'solid'
        }}
        drag
        dragConstraints={constraintsRef}
        dragMomentum={false}
        dragElastic={0}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        dragControls={dragControls}
        whileDrag={{ cursor: 'grabbing' }}
        whileTap={{ cursor: 'grabbing' }}
      >
        <div className="w-full h-full rounded-full overflow-hidden">
          <img
            src={getAvatarImage()}
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
      </motion.div>
    </div>
  );
};

export default Draggable;
