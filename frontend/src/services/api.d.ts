import { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

declare const api: AxiosInstance & {
  (config: AxiosRequestConfig): Promise<AxiosResponse>;
  (url: string, config?: AxiosRequestConfig): Promise<AxiosResponse>;
  defaults: any;
  interceptors: {
    request: any;
    response: any;
  };
  get<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>>;
  delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>>;
  head<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>>;
  options<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>>;
  post<T = any, R = AxiosResponse<T>>(url: string, data?: any, config?: AxiosRequestConfig): Promise<R>;
  put<T = any, R = AxiosResponse<T>>(url: string, data?: any, config?: AxiosRequestConfig): Promise<R>;
  patch<T = any, R = AxiosResponse<T>>(url: string, data?: any, config?: AxiosRequestConfig): Promise<R>;
};

export default api;
