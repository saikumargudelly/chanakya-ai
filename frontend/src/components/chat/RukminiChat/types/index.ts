export type Gender = 'male' | 'female' | 'neutral';

export interface Message {
  id: string;
  text: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
  mood?: MoodType;
  isError?: boolean;
}

export type MoodType = 'calm' | 'happy' | 'excited' | 'stressed' | 'neutral';

export interface UserContext {
  gender: Gender;
  name: string;
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

export interface QuickReply {
  id: string;
  text: string;
  emoji: string;
}
