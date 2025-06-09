import React from 'react';

const ChatBubble = ({ sender, text, isTyping = false, pillar = null }) => {
  const isAI = sender === 'ai';
  const bubbleClasses = `max-w-[85%] rounded-2xl px-4 py-2 my-1 ${
    isAI 
      ? 'bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100 rounded-tl-none' 
      : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-tr-none ml-auto'
  }`;

  // Pillar emoji mapping
  const pillarEmojis = {
    'Positive Emotion': '😊',
    'Engagement': '🧠',
    'Relationships': '❤️',
    'Meaning': '🌟',
    'Accomplishment': '🏆',
  };

  return (
    <div className={`flex ${isAI ? 'justify-start' : 'justify-end'} w-full`}>
      <div className={bubbleClasses}>
        {isAI && pillar && (
          <div className="text-xs font-semibold mb-1 flex items-center">
            <span className="mr-1">{pillarEmojis[pillar] || '💡'}</span>
            {pillar}
          </div>
        )}
        {isTyping ? (
          <div className="flex space-x-1">
            <div className="w-2 h-2 bg-gray-400 dark:bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2 h-2 bg-gray-400 dark:bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-2 h-2 bg-gray-400 dark:bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
        ) : (
          <div className="whitespace-pre-wrap">{text}</div>
        )}
      </div>
    </div>
  );
};

export default ChatBubble;
