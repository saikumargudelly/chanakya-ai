import React, { useState } from 'react';
import axios from 'axios';

const moods = [
  { label: '😊 Happy', value: 'happy' },
  { label: '😐 Neutral', value: 'neutral' },
  { label: '😔 Sad', value: 'sad' },
  { label: '😠 Stressed', value: 'stressed' },
];

const MoodTracker = () => {
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
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
      <h2 className="text-xl font-bold mb-2">Mood Tracker</h2>
      <div className="flex gap-2 mb-2">
        {moods.map(m => (
          <button
            key={m.value}
            className={`px-3 py-2 rounded-lg border font-semibold focus:outline-none ${selectedMood === m.value ? 'bg-blue-500 text-white' : 'bg-gray-100 dark:bg-gray-900 border-gray-300 dark:border-gray-600'}`}
            onClick={() => handleMood(m.value)}
          >
            {m.label}
          </button>
        ))}
      </div>
      {feedback && <div className="text-green-500 text-sm">{feedback}</div>}
    </div>
  );
};

export default MoodTracker;
