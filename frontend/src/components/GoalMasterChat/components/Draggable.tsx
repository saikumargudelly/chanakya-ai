import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useChat } from '../context/ChatContext';

export const Draggable: React.FC = () => {
  const { toggleChat } = useChat();
  const [isDragging, setIsDragging] = useState(false);

  const handleDragStart = useCallback(() => {
    setIsDragging(true);
  }, []);

  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  return (
    <motion.div
      drag
      dragMomentum={false}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      className="fixed bottom-4 right-4 z-50"
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
    >
      <button
        onClick={toggleChat}
        className={`w-14 h-14 rounded-full bg-indigo-500 text-white shadow-lg flex items-center justify-center text-2xl transition-transform ${
          isDragging ? 'scale-90' : ''
        }`}
      >
        🎯
      </button>
    </motion.div>
  );
}; 
 