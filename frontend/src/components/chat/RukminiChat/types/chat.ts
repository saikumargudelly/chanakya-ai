export type Gender = 'male' | 'female' | 'other';
export type MoodType = 'happy' | 'sad' | 'angry' | 'neutral' | 'calm' | 'excited' | 'stressed';

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
  payload: string;
}

export interface UserContext {
  name: string;
  gender: Gender;
  mood: MoodType;
  wisdomLevel: number;
  xp: number;
}

export interface ChatConfig {
  isOpen: boolean;
  assistantName: string;
  assistantGender: Gender;
  theme: {
    primary: string;
    secondary: string;
    background: string;
    text: string;
  };
}

export interface ChatContextType {
  messages: Message[];
  isTyping: boolean;
  mood: MoodType;
  sendMessage: (content: string) => Promise<void>;
  setTyping: (isTyping: boolean) => void;
  setMood: (mood: MoodType) => void;
  isOpen: boolean;
  toggleChat: () => void;
  config: ChatConfig;
  quickReplies: QuickReply[];
  userContext: UserContext;
  updateUserContext: (updates: Partial<UserContext>) => void;
}

export interface ChatApiResponse {
  response: string;
  timestamp: string;
} 