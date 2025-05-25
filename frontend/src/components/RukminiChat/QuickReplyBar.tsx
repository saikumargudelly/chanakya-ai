import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import React from 'react';
import { QuickReply } from '../../types/chat';

interface QuickReplyBarProps {
  quickReplies: QuickReply[];
  onQuickReply: (quickReply: QuickReply) => void;
  visible?: boolean;
}

// Create type-safe motion components using type assertion
const MotionDiv = motion.div as React.ComponentType<any>;
const MotionButton = motion.button as React.ComponentType<any>;

export const QuickReplyBar: React.FC<QuickReplyBarProps> = ({
  quickReplies = [],
  onQuickReply,
  visible = true,
}) => {
  const [displayedReplies, setDisplayedReplies] = useState<QuickReply[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const repliesPerPage = 3;

  useEffect(() => {
    if (visible) {
      // Show a different set of quick replies each time they become visible
      const start = (currentIndex * repliesPerPage) % quickReplies.length;
      const end = start + repliesPerPage;
      const newReplies = [
        ...quickReplies.slice(start, end),
        ...(end > quickReplies.length ? quickReplies.slice(0, end % quickReplies.length) : []),
      ].slice(0, repliesPerPage);
      
      setDisplayedReplies(newReplies);
      setCurrentIndex((prev) => (prev + 1) % Math.ceil(quickReplies.length / repliesPerPage));
    }
  }, [visible, currentIndex, quickReplies]);

  if (!visible) return null;

  return (
    <AnimatePresence>
      <MotionDiv 
        className="px-4 py-2 bg-white dark:bg-gray-800 border-t border-b border-gray-200 dark:border-gray-700 overflow-x-auto"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.2 }}
      >
        <div className="flex space-x-2">
          {displayedReplies.map((reply, index) => (
            <MotionButton
              key={index}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onQuickReply(reply)}
              className="px-3 py-1.5 text-sm font-medium rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100 hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors whitespace-nowrap flex items-center space-x-1"
            >
              {reply.emoji && <span>{reply.emoji}</span>}
              <span>{reply.text}</span>
            </MotionButton>
          ))}
        </div>
      </MotionDiv>
    </AnimatePresence>
  );
};
