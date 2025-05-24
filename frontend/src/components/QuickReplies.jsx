import React from 'react';

const QuickReplies = ({ replies = [], onReply }) => {
  return (
    <div className="flex flex-wrap gap-2 justify-center my-2">
      {replies.map((reply, index) => (
        <button
          key={index}
          onClick={() => onReply(reply)}
          className="px-3 py-1 text-sm rounded-full bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
        >
          {reply}
        </button>
      ))}
    </div>
  );
};

export default QuickReplies;
