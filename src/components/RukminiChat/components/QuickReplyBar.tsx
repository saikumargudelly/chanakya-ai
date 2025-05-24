import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QuickReply } from '../types';

interface QuickReplyBarProps {
  quickReplies: QuickReply[];
  onSelect: (text: string) => void;
  visible: boolean;
}

export const QuickReplyBar: React.FC<QuickReplyBarProps> = ({
  quickReplies,
  onSelect,
  visible,
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
      <motion.div 
        className="px-4 py-2 bg-white dark:bg-gray-800 border-t border-b border-gray-200 dark:border-gray-700 overflow-x-auto"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.2 }}
      >
        <div className="flex space-x-2 min-w-max">
          {displayedReplies.map((reply) => (
            <motion.button
              key={reply.id}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onSelect(reply.text)}
              className="px-3 py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-full text-sm font-medium whitespace-nowrap
                        hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center border border-gray-200 dark:border-gray-600"
            >
              <span className="mr-1.5">{reply.emoji}</span>
              {reply.text}
            </motion.button>
          ))}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
