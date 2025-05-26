import * as React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { Message, MoodType, Gender } from './types/chat';

interface MessageBubbleProps {
  message: Message;
  isUser: boolean;
  assistantName: string;
  assistantGender: 'male' | 'female' | 'neutral';
}

const moodColors = {
  calm: 'from-blue-400 to-blue-500',
  happy: 'from-yellow-400 to-amber-500',
  excited: 'from-pink-500 to-purple-500',
  stressed: 'from-red-400 to-orange-500',
  neutral: 'from-gray-400 to-gray-500',
};

// Create a type-safe motion component using type assertion
const MotionDiv = motion.div as React.ComponentType<any>;

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isUser,
  assistantName,
  assistantGender,
}) => {
  const getAvatar = () => {
    if (isUser) return null;
    
    // Use SVG images for assistant avatars
    const avatarSrc = 
      assistantGender === 'male' ? '/avatars/krish.svg' :
      assistantGender === 'female' ? '/avatars/rukmini.svg' :
      '/avatars/chanakya.svg';

    const avatarAlt = 
      assistantGender === 'male' ? 'Krish Avatar' :
      assistantGender === 'female' ? 'Rukmini Avatar' :
      'Assistant Avatar';
    
    return (
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-bold overflow-hidden">
        <img 
          src={avatarSrc}
          alt={avatarAlt}
          className="w-full h-full object-cover"
        />
      </div>
    );
  };

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const bubbleVariants = {
    hidden: { 
      opacity: 0, 
      y: 20,
      scale: 0.95 
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: 'spring',
        stiffness: 500,
        damping: 30
      }
    }
  };

  return (
    <MotionDiv
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}
      initial="hidden"
      animate="visible"
      variants={bubbleVariants}
    >
      {!isUser && <div className="self-end mb-2 mr-2">{getAvatar()}</div>}
      
      <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-xs md:max-w-md`}>
        {!isUser && (
          <span className="text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">
            {assistantName}
          </span>
        )}
        
        <div
          className={`relative px-4 py-2 rounded-2xl ${
            isUser
              ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-br-none'
              : `bg-gradient-to-r ${message.mood ? moodColors[message.mood] : 'from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800'} text-gray-800 dark:text-gray-100 rounded-bl-none`
          } shadow-md`}
        >
          <p className="whitespace-pre-wrap break-words">{message.text}</p>
          
          {/* Message tail */}
          <div
            className={`absolute bottom-0 w-3 h-3 ${
              isUser
                ? 'bg-indigo-500 -right-3 rounded-br-3xl rounded-tl-2xl'
                : `${
                    message.mood 
                      ? moodColors[message.mood].split(' ')[0].replace('from-', 'bg-')
                      : 'bg-gray-100 dark:bg-gray-700'
                  } -left-3 rounded-bl-3xl rounded-tr-2xl`
            }`}
            style={{
              clipPath: isUser 
                ? 'polygon(0 0, 100% 100%, 100% 0)'
                : 'polygon(100% 0, 0 100%, 0 0)'
            }}
          />
        </div>
        
        <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          {formatTime(message.timestamp)}
        </span>
      </div>
      
      {isUser && (
        <div className="self-end mb-2 ml-2 w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-bold">
          {message.sender === 'user' ? '👤' : ''}
        </div>
      )}
    </MotionDiv>
  );
};
