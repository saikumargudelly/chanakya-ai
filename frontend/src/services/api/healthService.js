import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

export async function checkBackendHealth() {
  try {
    const response = await axios.get(`${API_BASE_URL}/health`, {
      timeout: 5000, // 5 second timeout
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
    return {
      status: response.status,
      data: response.data,
      isHealthy: response.status === 200
    };
  } catch (error) {
    console.error('Health check failed:', {
      message: error.message,
      code: error.code,
      response: error.response?.data,
      status: error.response?.status,
      config: {
        url: error.config?.url,
        method: error.config?.method,
        timeout: error.config?.timeout
      }
    });
    
    return {
      isHealthy: false,
      error: {
        message: error.message,
        code: error.code,
        status: error.response?.status,
        data: error.response?.data
      }
    };
  }
}

export async function testApiEndpoint() {
  try {
    const response = await axios.get(`${API_BASE_URL}/test-endpoint`, {
      timeout: 5000
    });
    return {
      success: true,
      status: response.status,
      data: response.data
    };
  } catch (error) {
    console.error('API test endpoint failed:', error);
    return {
      success: false,
      error: {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      }
    };
  }
}
