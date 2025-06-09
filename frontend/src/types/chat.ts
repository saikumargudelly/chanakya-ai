export type MoodType = 'calm' | 'happy' | 'excited' | 'stressed' | 'neutral';
export type Gender = 'male' | 'female' | 'neutral' | 'other';

export interface ChatApiResponse {
  response: string;
  quickReplies?: QuickReply[];
  mood?: MoodType;
  metadata?: Record<string, any>;
}

export interface User {
  id?: string;
  name: string;
  gender: Gender;
  mood?: MoodType;
  wisdomLevel?: number;
  xp?: number;
}

export interface Message {
  id: string;
  text: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
  mood?: MoodType;
  isError?: boolean;
}

export interface QuickReply {
  id: string;
  text: string;
  emoji: string;
  payload?: string;
}

export interface ChatConfig {
  isOpen: boolean;
  assistantName: string;
  assistantGender: 'male' | 'female' | 'neutral' | 'other';
  theme: {
    primary: string;
    secondary: string;
    background: string;
    text: string;
  };
}

export interface UserContext {
  gender: Gender;
  name: string;
  mood: MoodType;
  wisdomLevel: number;
  xp: number;
}

export interface ChatContextType {
  // Base chat functionality
  messages: Message[];
  isTyping: boolean;
  mood: MoodType;
  sendMessage: (content: string) => void;
  setTyping: (isTyping: boolean) => void;
  setMood: (mood: MoodType) => void;
  
  // Chat drawer functionality
  isOpen: boolean;
  toggleChat: () => void;
  config: ChatConfig;
  quickReplies: QuickReply[];
  userContext: UserContext;
}
