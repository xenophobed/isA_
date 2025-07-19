/**
 * API Service Layer for external integrations
 * Handles HTTP requests, error handling, and response formatting
 */

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  statusCode?: number;
}

export interface RequestConfig {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  timeout?: number;
  retries?: number;
}

export class ApiService {
  private baseUrl: string;
  private defaultHeaders: Record<string, string>;
  private timeout: number;

  constructor(baseUrl: string = '', timeout: number = 10000) {
    this.baseUrl = baseUrl;
    this.timeout = timeout;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };
  }

  /**
   * Generic HTTP request method
   */
  async request<T = any>(
    endpoint: string, 
    config: RequestConfig & { body?: any } = {}
  ): Promise<ApiResponse<T>> {
    const {
      method = 'GET',
      headers = {},
      timeout = this.timeout,
      retries = 3,
      body
    } = config;

    const url = this.buildUrl(endpoint);
    const requestHeaders = { ...this.defaultHeaders, ...headers };

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        const response = await fetch(url, {
          method,
          headers: requestHeaders,
          body: body ? JSON.stringify(body) : undefined,
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        return { success: true, data, statusCode: response.status };

      } catch (error) {
        if (attempt === retries) {
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            statusCode: 0
          };
        }
        
        // Wait before retry (exponential backoff)
        await this.delay(Math.pow(2, attempt) * 1000);
      }
    }

    return { success: false, error: 'Max retries exceeded' };
  }

  /**
   * GET request
   */
  async get<T = any>(endpoint: string, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...config, method: 'GET' });
  }

  /**
   * POST request
   */
  async post<T = any>(endpoint: string, body?: any, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...config, method: 'POST', body });
  }

  /**
   * PUT request
   */
  async put<T = any>(endpoint: string, body?: any, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...config, method: 'PUT', body });
  }

  /**
   * DELETE request
   */
  async delete<T = any>(endpoint: string, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...config, method: 'DELETE' });
  }

  /**
   * Upload file
   */
  async uploadFile(endpoint: string, file: File, additionalData?: Record<string, any>): Promise<ApiResponse> {
    const formData = new FormData();
    formData.append('file', file);

    if (additionalData) {
      Object.entries(additionalData).forEach(([key, value]) => {
        formData.append(key, String(value));
      });
    }

    const url = this.buildUrl(endpoint);

    try {
      const response = await fetch(url, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return { success: true, data, statusCode: response.status };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed',
        statusCode: 0
      };
    }
  }

  /**
   * Set authentication header
   */
  setAuthToken(token: string, type: 'Bearer' | 'API-Key' = 'Bearer'): void {
    this.defaultHeaders['Authorization'] = `${type} ${token}`;
  }

  /**
   * Remove authentication
   */
  clearAuth(): void {
    delete this.defaultHeaders['Authorization'];
  }

  /**
   * Set custom header
   */
  setHeader(key: string, value: string): void {
    this.defaultHeaders[key] = value;
  }

  /**
   * Remove header
   */
  removeHeader(key: string): void {
    delete this.defaultHeaders[key];
  }

  private buildUrl(endpoint: string): string {
    if (endpoint.startsWith('http')) {
      return endpoint;
    }
    
    const base = this.baseUrl.endsWith('/') ? this.baseUrl : `${this.baseUrl}/`;
    const path = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
    
    return `${base}${path}`;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Specific API service instances
export const imageGenerationApi = new ApiService('https://api.replicate.com');
export const productSearchApi = new ApiService('https://api.shopping.com');
export const contentGenerationApi = new ApiService('https://api.openai.com');

// Main backend API
export const backendApi = new ApiService('http://localhost:8080');

// Helper function to handle API errors consistently
export const handleApiError = (response: ApiResponse, defaultMessage: string = 'An error occurred'): never => {
  const errorMessage = response.error || defaultMessage;
  throw new Error(errorMessage);
};

// Helper function to safely execute API calls with loading states
export const withApiLoading = async <T>(
  apiCall: () => Promise<ApiResponse<T>>,
  setLoading: (loading: boolean) => void,
  setError: (error: string | null) => void
): Promise<T | null> => {
  setLoading(true);
  setError(null);

  try {
    const response = await apiCall();
    
    if (!response.success) {
      setError(response.error || 'API call failed');
      return null;
    }

    return response.data || null;
  } catch (error) {
    setError(error instanceof Error ? error.message : 'Unknown error');
    return null;
  } finally {
    setLoading(false);
  }
};