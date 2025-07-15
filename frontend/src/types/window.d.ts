interface GoogleLoginError {
  type: string;
  message: string;
}

interface GoogleOAuthError extends Error {
  type?: string;
  error?: string;
  error_description?: string;
}

interface GoogleOAuthResponse {
  credential?: string;
  select_by?: string;
}

interface GoogleAccountsConfig {
  client_id: string;
  callback: (response: GoogleOAuthResponse) => void;
  auto_select?: boolean;
  cancel_on_tap_outside?: boolean;
  prompt_parent_id?: string;
  error_callback?: (error: GoogleOAuthError) => void;
}

interface Window {
  google?: {
    accounts?: {
      id?: {
        initialize: (config: GoogleAccountsConfig) => void;
        prompt: (notification?: { notification_features: string }) => void;
        cancel: () => void;
        revoke: (email: string, callback: () => void) => void;
        storeCredential: (credential: { id: string; password: string }) => Promise<void>;
        // Add retry mechanism
        renderButton: (element: HTMLElement, config: object) => void;
        disableAutoSelect: () => void;
      };
    };
  };
}
