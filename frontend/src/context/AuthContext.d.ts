import { Gender } from '../types/chat';

export interface User {
  name?: string;
  first_name?: string;
  email: string;
  picture: string;
  gender?: Gender;
  id?: string;
}

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  handleLogout: () => void;
  handleLoginSuccess: (credentialResponse: any) => void;
  isLoading?: boolean;
  token?: string;
}

export const AuthProvider: React.FC<{ children: React.ReactNode }>;
export const useAuth: () => AuthContextType;
export const GoogleLoginButton: React.FC;
