import React, { useState } from 'react';
import axios from 'axios';

const moods = [
  { label: '😊 Happy', value: 'happy'},
  { label: '😐 Neutral', value: 'neutral' },
  { label: '😟 Sad', value: 'sad' },
  { label: '😠 Stressed', value: 'stressed' },
];

const QuickMoodPicker = ({ onMoodLogged }) => {
  const [selectedMood, setSelectedMood] = useState('');
  const [feedback, setFeedback] = useState('');

  const handleMood = async (mood) => {
    setSelectedMood(mood);
    setFeedback('');
    try {
      const res = await axios.post('http://localhost:5001/mood', { mood });
      setFeedback(res.data.message);
    } catch {
      setFeedback('Failed to log mood.');
    }
  };

  return (
    <>
      <div className="flex items-center gap-4 mb-4 flex-wrap">
        <div className="flex gap-3 flex-wrap">
          {moods.map(m => (
            <button
              key={m.value}
              className={`px-4 py-2 rounded-xl border font-semibold focus:outline-none shadow-sm transition-all duration-150 text-lg flex items-center gap-1
                ${selectedMood === m.value ? 'bg-blue-500 text-white border-blue-700 scale-105' : 'bg-gray-100 dark:bg-gray-900 border-gray-300 dark:border-gray-600 hover:bg-blue-100 dark:hover:bg-blue-900'}`}
              onClick={() => handleMood(m.value)}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>
      {feedback && <div className="text-blue-600 dark:text-blue-300 text-sm font-medium animate-pulse">{feedback}</div>}
    </>
  );
};

export default QuickMoodPicker;
