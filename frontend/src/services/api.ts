import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor
    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor
    this.api.interceptors.response.use(
      (response: AxiosResponse) => response.data,
      (error: AxiosError) => {
        if (error.response) {
          // Handle different HTTP status codes
          switch (error.response.status) {
            case 401:
              // Handle unauthorized
              localStorage.removeItem('token');
              window.location.href = '/login';
              break;
            case 403:
              // Handle forbidden
              console.error('Forbidden: You do not have permission to access this resource');
              break;
            case 404:
              console.error('Resource not found');
              break;
            case 500:
              console.error('Server error');
              break;
            default:
              console.error('An error occurred');
          }
        } else if (error.request) {
          console.error('No response received from server');
        } else {
          console.error('Error:', error.message);
        }
        return Promise.reject(error);
      }
    );
  }

  // Generic request method
  public async request<T>(config: AxiosRequestConfig): Promise<T> {
    try {
      const response = await this.api.request<T>(config);
      return response as unknown as T;
    } catch (error) {
      throw error;
    }
  }

  // Specific API methods
  public async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>({ ...config, method: 'GET', url });
  }

  public async post<T>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<T> {
    return this.request<T>({ ...config, method: 'POST', url, data });
  }

  public async put<T>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<T> {
    return this.request<T>({ ...config, method: 'PUT', url, data });
  }

  public async delete<T>(
    url: string,
    config?: AxiosRequestConfig
  ): Promise<T> {
    return this.request<T>({ ...config, method: 'DELETE', url });
  }
}

const apiService = new ApiService();

export default apiService;
