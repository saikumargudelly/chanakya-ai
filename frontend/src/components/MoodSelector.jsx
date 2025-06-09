import React from 'react';
import { motion } from 'framer-motion';

const MOODS = [
  { emoji: '😞', value: 0, label: 'Very Low' },
  { emoji: '😕', value: 1, label: 'Low' },
  { emoji: '😐', value: 2, label: 'Neutral' },
  { emoji: '🙂', value: 3, label: 'Good' },
  { emoji: '😊', value: 4, label: 'Very Good' },
];

const MoodSelector = ({ selectedValue, onSelect }) => {
  return (
    <div className="flex justify-between space-x-2 my-4">
      {MOODS.map((mood) => (
        <motion.button
          key={mood.value}
          type="button"
          onClick={() => onSelect(mood.value)}
          whileHover={{ scale: 1.1, y: -5 }}
          whileTap={{ scale: 0.95 }}
          className={`flex flex-col items-center p-3 rounded-xl transition-all ${
            selectedValue === mood.value
              ? 'bg-indigo-100 dark:bg-indigo-900/50 scale-110'
              : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
          }`}
        >
          <span className="text-3xl mb-1">{mood.emoji}</span>
          <span className="text-xs text-gray-600 dark:text-gray-300">{mood.label}</span>
        </motion.button>
      ))}
    </div>
  );
};

export default MoodSelector;
