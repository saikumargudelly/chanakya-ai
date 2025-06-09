declare module '@react-oauth/google' {
  import { ReactNode } from 'react';

  export interface GoogleLoginProps {
    onSuccess: (credentialResponse: CredentialResponse) => void;
    onError: () => void;
    useOneTap?: boolean;
    width?: string | number;
    size?: 'small' | 'medium' | 'large';
    text?: 'signin' | 'signup' | 'continue_with' | 'signin_with';
    shape?: 'rectangular' | 'pill' | 'circle' | 'square';
    theme?: 'outline' | 'filled_blue' | 'filled_black';
    logo_alignment?: 'left' | 'center';
    width?: string;
    type?: 'standard' | 'icon';
    locale?: string;
    click_listener?: (response: any) => void;
    state_cookie_domain?: string;
    ux_mode?: 'popup' | 'redirect';
    auto_select?: boolean;
    cancel_on_tap_outside?: boolean;
    nonce?: string;
    context?: string;
    itp_support?: boolean;
    prompt_parent_id?: string;
    promptMomentNotification?: (notification: any) => void;
  }

  export interface CredentialResponse {
    credential?: string;
    clientId?: string;
    select_by?: string;
  }

  export const GoogleOAuthProvider: React.FC<{
    clientId: string;
    children: ReactNode;
  }>;

  export const GoogleLogin: React.FC<GoogleLoginProps>;
  
  export const googleLogout: () => void;
  export const useGoogleLogin: (options?: any) => () => void;
  export const useGoogleOneTapLogin: (options: any) => void;
  export const hasGrantedAllScopes: (
    tokenResponse: any,
    firstScope: string,
    ...restScopes: string[]
  ) => boolean;
  export const hasGrantedAnyScope: (
    tokenResponse: any,
    firstScope: string,
    ...restScopes: string[]
  ) => boolean;
}
