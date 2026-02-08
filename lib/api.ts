const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: any;
  headers?: Record<string, string>;
}

/**
 * Generic API request function with TypeScript support
 * 
 * @template T - The expected response type
 * @param endpoint - API endpoint (e.g., '/auth/login')
 * @param options - Request options (method, body, headers)
 * @returns Promise resolving to typed response data
 */
async function request<T = any>(
  endpoint: string, 
  options: RequestOptions = {}
): Promise<T> {
  const { method = 'GET', body, headers = {} } = options;

  // Get token from localStorage
  const token = localStorage.getItem('token');
  
  const defaultHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...headers,
  };

  // Add authorization header if token exists
  if (token) {
    defaultHeaders.Authorization = `Bearer ${token}`;
  }

  const config: RequestInit = {
    method,
    headers: defaultHeaders,
  };

  // Add body for non-GET requests
  if (body) {
    config.body = JSON.stringify(body);
  }

  try {
    console.log(`[v0] API Request: ${method} ${API_BASE_URL}${endpoint}`, { 
      body: body ? Object.keys(body) : 'none',
      hasAuth: !!token 
    });
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

    console.log(`[v0] API Response: ${response.status} ${response.statusText}`);

    // Handle 401 - Unauthorized (session expired)
    if (response.status === 401) {
      console.warn('[v0] Session expired (401), clearing auth and redirecting to login');
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      
      if (typeof window !== 'undefined') {
        window.location.href = '/login?expired=true';
      }
      
      throw new Error('Session expired. Please login again.');
    }

    // Handle non-OK responses
    if (!response.ok) {
      let errorData: any = {};
      
      try {
        errorData = await response.json();
      } catch (jsonError) {
        // Response is not JSON, try to get text
        try {
          const text = await response.text();
          console.error('[v0] API returned non-JSON response:', text.substring(0, 500));
          errorData = { message: text };
        } catch (textError) {
          console.error('[v0] Could not read response body');
        }
      }
      
      const errorMessage = 
        errorData.message || 
        errorData.error || 
        `API Error: ${response.status} ${response.statusText}`;
      
      console.error(`[v0] API Error: ${method} ${endpoint}`, {
        status: response.status,
        message: errorMessage,
        data: errorData
      });
      
      // Create error object with response data attached
      const err = new Error(errorMessage) as any;
      err.response = {
        status: response.status,
        statusText: response.statusText,
        data: errorData
      };
      
      throw err;
    }

    // Parse successful response
    const data: T = await response.json();
    
    console.log(`[v0] API Success: ${method} ${endpoint}`, {
      dataType: typeof data,
      isObject: typeof data === 'object',
      keys: typeof data === 'object' && data !== null ? Object.keys(data) : []
    });
    
    return data;
    
  } catch (error: any) {
    // Log the error (but don't expose sensitive info in production)
    if (process.env.NODE_ENV === 'development') {
      console.error(`[v0] API Request Failed: ${method} ${endpoint}`, error);
    } else {
      console.error(`[v0] API Request Failed: ${method} ${endpoint}`);
    }
    
    throw error;
  }
}

/**
 * Typed API client with convenience methods
 * 
 * Usage:
 * ```typescript
 * // Without typing (returns any)
 * const data = await API.get('/bugs');
 * 
 * // With typing
 * interface BugsResponse { data: Bug[] }
 * const response = await API.get<BugsResponse>('/bugs');
 * 
 * // Post with typing
 * interface LoginResponse { user: User, token: string }
 * const response = await API.post<LoginResponse>('/auth/login', { email, password });
 * ```
 */
const API = {
  /**
   * GET request
   * @template T - Expected response type
   */
  get: <T = any>(endpoint: string): Promise<T> => 
    request<T>(endpoint, { method: 'GET' }),
  
  /**
   * POST request
   * @template T - Expected response type
   */
  post: <T = any>(endpoint: string, body: any): Promise<T> =>
    request<T>(endpoint, { method: 'POST', body }),
  
  /**
   * PUT request
   * @template T - Expected response type
   */
  put: <T = any>(endpoint: string, body: any): Promise<T> =>
    request<T>(endpoint, { method: 'PUT', body }),
  
  /**
   * PATCH request
   * @template T - Expected response type
   */
  patch: <T = any>(endpoint: string, body: any): Promise<T> =>
    request<T>(endpoint, { method: 'PATCH', body }),
  
  /**
   * DELETE request
   * @template T - Expected response type
   */
  delete: <T = any>(endpoint: string): Promise<T> => 
    request<T>(endpoint, { method: 'DELETE' }),
};

export default API;

/**
 * Common API response types
 * Add these to a separate types file in production
 */
export interface User {
  _id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'TESTER' | 'DEVELOPER';
}

export interface LoginResponse {
  user: User;
  token: string;
}

export interface RegisterResponse {
  user: User;
  token: string;
}

export interface Bug {
  _id: string;
  title: string;
  description: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'CLOSED' | 'RESOLVED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  projectId: string;
  createdBy: string;
  assignedTo?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BugsResponse {
  data: Bug[];
}

export interface Project {
  _id: string;
  name: string;
  description: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectsResponse {
  data: Project[];
}