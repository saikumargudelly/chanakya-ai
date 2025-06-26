import React, { useState, useCallback, useEffect, useRef } from 'react';
import { GoogleOAuthProvider, GoogleLogin, CredentialResponse, googleLogout } from '@react-oauth/google';
import { Box, Button, useToast } from '@chakra-ui/react';
import { FcGoogle } from 'react-icons/fc';

interface GoogleSignInButtonProps {
  onSuccess: (response: any) => void;
  onError?: (error: any) => void;
  buttonText?: string;
  isFullWidth?: boolean;
}

const GoogleSignInButton: React.FC<GoogleSignInButtonProps> = ({
  onSuccess,
  onError,
  buttonText = 'Continue with Google',
  isFullWidth = true,
}) => {
  const [mounted, setMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();
  const googleLoginRef = useRef<HTMLDivElement>(null);
  const [isGoogleMounted, setIsGoogleMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Give Google's script time to load
    const timer = setTimeout(() => {
      setIsGoogleMounted(true);
    }, 1000);

    return () => {
      setMounted(false);
      clearTimeout(timer);
      googleLogout();
    };
  }, []);

  const handleSuccess = async (credentialResponse: CredentialResponse) => {
    if (!mounted || !credentialResponse.credential) {
      if (onError) {
        onError(new Error('No credential received from Google'));
      }
      return;
    }
    
    setIsLoading(true);
    try {
      // Directly pass the credential to the parent component
      // The parent component (AuthContext) will handle the API call
      if (mounted) {
        onSuccess(credentialResponse);
      }
    } catch (error) {
      console.error('Google login error:', error);
      if (mounted) {
        if (onError) {
          onError(error);
        } else {
          toast({
            title: 'Error',
            description: 'Failed to sign in with Google. Please try again.',
            status: 'error',
            duration: 5000,
            isClosable: true,
          });
        }
      }
    } finally {
      if (mounted) {
        setIsLoading(false);
      }
    }
  };

  const handleError = () => {
    console.error('Google login failed');
    if (mounted) {
      toast({
        title: 'Login failed',
        description: 'Unable to sign in with Google. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      onError?.(new Error('Google login failed'));
    }
  };

  const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;
  if (!clientId) {
    console.error('Google Client ID is not configured');
    return (
      <Button
        isDisabled
        colorScheme="red"
        leftIcon={<FcGoogle />}
        width={isFullWidth ? '100%' : 'auto'}
      >
        Google Sign-In Not Configured
      </Button>
    );
  }

  return (
    <Box width={isFullWidth ? '100%' : 'auto'}>
      <GoogleOAuthProvider clientId={clientId}>
        <Box display="none">
          <div ref={googleLoginRef}>
            {isGoogleMounted && (
              <GoogleLogin
                onSuccess={handleSuccess}
                onError={handleError}
                useOneTap={false}
                auto_select={false}
                text="signin_with"
                shape="rectangular"
                size="large"
                width="100%"
                ux_mode="popup"
              />
            )}
          </div>
        </Box>
        <Button
          onClick={() => {
            const googleButton = googleLoginRef.current?.querySelector<HTMLDivElement>('div[role=button]');
            if (googleButton) {
              googleButton.dispatchEvent(new MouseEvent('click', { bubbles: true }));
            } else if (onError) {
              onError(new Error('Google Sign-In initialization failed'));
              toast({
                title: 'Error',
                description: 'Failed to initialize Google Sign-In. Please try again.',
                status: 'error',
                duration: 5000,
                isClosable: true,
              });
            }
          }}
          leftIcon={<FcGoogle />}
          width="100%"
          variant="outline"
          isLoading={isLoading}
          loadingText="Signing in..."
          size="lg"
          fontSize="md"
          fontWeight="medium"
          borderRadius="md"
          borderColor="gray.300"
          _hover={{
            bg: 'gray.50',
            borderColor: 'gray.400',
          }}
          _active={{
            bg: 'gray.100',
            borderColor: 'gray.500',
          }}
        >
          {buttonText}
        </Button>
      </GoogleOAuthProvider>
    </Box>
  );
};

export default GoogleSignInButton;