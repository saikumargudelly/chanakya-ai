import { useState } from 'react';
import { CredentialResponse } from '@react-oauth/google';

interface UseGoogleAuthOptions {
  onSuccess: (data: any) => void;
  onError?: (error: Error) => void;
}

export function useGoogleAuth({ onSuccess, onError }: UseGoogleAuthOptions) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleAuth = async (credentialResponse: CredentialResponse) => {
    setIsLoading(true);
    setError(null);
    try {
      if (!credentialResponse.credential) {
        throw new Error('No credential in Google OAuth response');
      }

      // Decode the ID token to get user info
      const payload = JSON.parse(atob(credentialResponse.credential.split('.')[1]));
      
      // For now, we'll use the ID token approach but request additional scopes
      // In a production app, you'd want to use the full OAuth flow with access token
      const apiBaseUrl = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5001';
      const response = await fetch(`${apiBaseUrl}/api/v1/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          credential: credentialResponse.credential,
          client_id: process.env.REACT_APP_GOOGLE_CLIENT_ID,
        }),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Server responded with ${response.status}: ${errorText}`);
      }
      
      const data = await response.json();
      
      // Store tokens and user in localStorage
      if (data.access_token) {
        const expiresInMs = (data.expires_in || 3600) * 1000;
        const expiryTime = Date.now() + expiresInMs;
        localStorage.setItem('token', data.access_token);
        localStorage.setItem('token_expiry', expiryTime.toString());
      }
      
      if (data.user) {
        localStorage.setItem('user', JSON.stringify(data.user));
      }
      
      onSuccess(data);
    } catch (err: any) {
      setError(err.message || 'Failed to sign in with Google');
      if (onError) onError(err);
    } finally {
      setIsLoading(false);
    }
  };

  return { handleGoogleAuth, isLoading, error };
} 