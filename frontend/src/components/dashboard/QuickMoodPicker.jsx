import React, { useState } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { FiSmile, FiMeh, FiFrown, FiAlertCircle } from 'react-icons/fi';

const moods = [
  { 
    label: 'Happy', 
    value: 'happy',
    icon: FiSmile,
    color: 'yellow',
    emoji: '😊',
    message: 'Great to see you happy!'
  },
  { 
    label: 'Neutral', 
    value: 'neutral',
    icon: FiMeh,
    color: 'blue',
    emoji: '😐',
    message: 'Keeping it balanced!'
  },
  { 
    label: 'Sad', 
    value: 'sad',
    icon: FiFrown,
    color: 'purple',
    emoji: '😟',
    message: 'Hope things get better!'
  },
  { 
    label: 'Stressed', 
    value: 'stressed',
    icon: FiAlertCircle,
    color: 'red',
    emoji: '😠',
    message: 'Take a deep breath!'
  },
];

const MoodButton = ({ mood, isSelected, onClick }) => {
  const Icon = mood.icon;
  
  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={`
        relative px-3 py-1.5 rounded-md border font-semibold focus:outline-none 
        transition-all duration-300 text-sm flex items-center gap-1.5
        ${isSelected 
          ? `bg-${mood.color}-500 text-white border-${mood.color}-600 shadow-lg` 
          : `bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-white
             hover:bg-${mood.color}-50 dark:hover:bg-${mood.color}-900/30 
             hover:border-${mood.color}-200 dark:hover:border-${mood.color}-700`
        }
      `}
    >
      <motion.div
        initial={false}
        animate={{ scale: isSelected ? 1.1 : 1 }}
        transition={{ duration: 0.2 }}
      >
        {mood.emoji}
      </motion.div>
      <span>{mood.label}</span>
      {isSelected && (
        <motion.div
          layoutId="selectedMood"
          className={`absolute inset-0 rounded-md border-2 border-${mood.color}-400`}
          transition={{ duration: 0.2 }}
        />
      )}
    </motion.button>
  );
};

const FeedbackMessage = ({ message, mood }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -10 }}
    className={`text-${mood.color}-600 dark:text-${mood.color}-400 text-xs font-medium flex items-center gap-1`}
  >
    <span className="text-base">{mood.emoji}</span>
    {message}
  </motion.div>
);

const QuickMoodPicker = ({ onMoodLogged }) => {
  const [selectedMood, setSelectedMood] = useState('');
  const [feedback, setFeedback] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleMood = async (mood) => {
    setSelectedMood(mood.value);
    setFeedback('');
    setIsLoading(true);
    
    try {
      const res = await axios.post('http://localhost:5001/mood', { mood: mood.value });
      setFeedback(res.data.message);
      if (onMoodLogged) {
        onMoodLogged(mood.value);
      }
    } catch (error) {
      setFeedback('Failed to log mood. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-3 border border-gray-100 dark:border-gray-700">
      <h3 className="text-md font-semibold text-white mb-2">
        How are you feeling today?
      </h3>
      
      <div className="flex items-center gap-2 mb-2 flex-wrap justify-center">
        <div className="flex gap-2 flex-nowrap overflow-x-auto">
          {moods.map(mood => (
            <MoodButton
              key={mood.value}
              mood={mood}
              isSelected={selectedMood === mood.value}
              onClick={() => handleMood(mood)}
            />
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center justify-center py-1"
          >
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent"></div>
          </motion.div>
        ) : feedback && (
          <FeedbackMessage 
            message={feedback} 
            mood={moods.find(m => m.value === selectedMood)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default QuickMoodPicker;
