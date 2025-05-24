export type MoodType = 'calm' | 'happy' | 'excited' | 'stressed' | 'neutral';

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
  assistantGender: 'male' | 'female' | 'neutral';
  theme: {
    primary: string;
    secondary: string;
    background: string;
    text: string;
  };
}

export interface UserContext {
  gender: 'male' | 'female' | 'neutral';
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
