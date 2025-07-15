interface ApiConfig {
  BASE_URL: string;
  HEADERS: {
    'Content-Type': string;
    'Accept': string;
    'X-Requested-With'?: string; // Make this header optional
  };
  CREDENTIALS: RequestCredentials;
  MODE: RequestMode;
}

export const API_CONFIG: ApiConfig = {
  // Use relative URL for API requests to avoid CORS issues
  BASE_URL: '/api/v1',
  HEADERS: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  // Don't include credentials for now to avoid CORS issues
  CREDENTIALS: 'same-origin',
  MODE: 'same-origin'
};

export const handleApiError = (error: Error): never => {
  console.error('API Error:', error);
  if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
    console.error('Network error - Please check if the server is running');
  }
  throw error;
};