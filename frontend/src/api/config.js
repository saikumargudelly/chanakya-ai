export const API_CONFIG = {
  BASE_URL: 'http://localhost:8000/api/v1',
  HEADERS: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-Requested-With': 'XMLHttpRequest'
  },
  CREDENTIALS: 'include',
  MODE: 'cors'
};

export const handleApiError = (error) => {
  console.error('API Error:', error);
  if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
    console.error('Network error - Please check if the server is running');
  }
  throw error;
};
