import { ChatContextType as BaseChatContextType } from '../types/chat';

export interface ChatConfig {
  assistantName: string;
  assistantGender: 'male' | 'female' | 'neutral';
  defaultMood: string;
}

export interface UserContext {
  name: string;
  preferences: Record<string, unknown>;
}

export interface ChatContextType extends BaseChatContextType {
  isOpen: boolean;
  toggleChat: () => void;
  config: ChatConfig;
  quickReplies: Array<{ id: string; text: string; action: () => void }>;
  userContext: UserContext;
}

declare module '../../contexts/ChatContext' {
  export const useChat: () => ChatContextType;
  export const ChatProvider: React.FC<{ children: React.ReactNode }>;
}
