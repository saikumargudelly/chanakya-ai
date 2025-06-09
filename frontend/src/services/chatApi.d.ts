import { ChatApiResponse } from '../types/chat';

declare module 'services/chatApi' {
  export interface ChatRequest {
    user_id?: string;
    message: string;
    income: number | null;
    expenses: Record<string, any>;
    mood?: string;
    gender?: string;
    model: string;
    timezone: string;
  }

  const chatApi: {
    post: (url: string, data: ChatRequest) => Promise<{ data: ChatApiResponse }>;
  };
  
  export default chatApi;
}
