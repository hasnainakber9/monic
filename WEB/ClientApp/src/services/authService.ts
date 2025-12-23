/**
 * Authentication Service
 * JWT-based auth with token persistence and refresh
 */

import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000';

interface LoginCredentials {
  email: string;
  password: string;
}

interface AuthResponse {
  token: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: 'ADMIN' | 'MANAGER' | 'STARTUP' | 'VIEWER';
    organization?: string;
  };
}

interface User {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'MANAGER' | 'STARTUP' | 'VIEWER';
  organization?: string;
}

const AUTH_TOKEN_KEY = 'seic_auth_token';
const REFRESH_TOKEN_KEY = 'seic_refresh_token';
const USER_KEY = 'seic_user';

class AuthService {
  private currentUser: User | null = null;

  constructor() {
    this.loadFromStorage();
  }

  /**
   * Load persisted auth data from localStorage
   */
  private loadFromStorage() {
    const userStr = localStorage.getItem(USER_KEY);
    if (userStr) {
      try {
        this.currentUser = JSON.parse(userStr);
      } catch (e) {
        console.error('Failed to parse stored user');
        this.logout();
      }
    }
  }

  /**
   * Login with email and password
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const response = await axios.post<AuthResponse>(
        `${API_BASE}/api/auth/login`,
        credentials
      );

      const { token, refreshToken, user } = response.data;

      // Store tokens
      localStorage.setItem(AUTH_TOKEN_KEY, token);
      localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
      localStorage.setItem(USER_KEY, JSON.stringify(user));

      this.currentUser = user;

      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Login failed');
    }
  }

  /**
   * Register new user (limited to SEIC admins initially)
   */
  async register(data: {
    email: string;
    password: string;
    name: string;
    role: string;
  }): Promise<User> {
    try {
      const response = await axios.post<User>(
        `${API_BASE}/api/auth/register`,
        data,
        {
          headers: {
            Authorization: `Bearer ${this.getToken()}`,
          },
        }
      );
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Registration failed');
    }
  }

  /**
   * Logout and clear auth data
   */
  logout() {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this.currentUser = null;
  }

  /**
   * Get current auth token
   */
  getToken(): string | null {
    return localStorage.getItem(AUTH_TOKEN_KEY);
  }

  /**
   * Get refresh token
   */
  getRefreshToken(): string | null {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  }

  /**
   * Refresh token when expired
   */
  async refreshAccessToken(): Promise<string> {
    try {
      const refreshToken = this.getRefreshToken();
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await axios.post<{ token: string }>(
        `${API_BASE}/api/auth/refresh`,
        { refreshToken }
      );

      const { token } = response.data;
      localStorage.setItem(AUTH_TOKEN_KEY, token);
      return token;
    } catch (error: any) {
      this.logout();
      throw new Error('Token refresh failed');
    }
  }

  /**
   * Get current user
   */
  getCurrentUser(): User | null {
    return this.currentUser;
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!this.getToken() && !!this.currentUser;
  }

  /**
   * Check if user has specific role
   */
  hasRole(role: string): boolean {
    return this.currentUser?.role === role;
  }

  /**
   * Check if user has any of specified roles
   */
  hasAnyRole(roles: string[]): boolean {
    return this.currentUser ? roles.includes(this.currentUser.role) : false;
  }

  /**
   * Change password
   */
  async changePassword(
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    try {
      await axios.post(
        `${API_BASE}/api/auth/change-password`,
        { currentPassword, newPassword },
        {
          headers: {
            Authorization: `Bearer ${this.getToken()}`,
          },
        }
      );
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Password change failed');
    }
  }

  /**
   * Request password reset
   */
  async requestPasswordReset(email: string): Promise<void> {
    try {
      await axios.post(`${API_BASE}/api/auth/forgot-password`, { email });
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || 'Password reset request failed'
      );
    }
  }

  /**
   * Reset password with token
   */
  async resetPassword(token: string, newPassword: string): Promise<void> {
    try {
      await axios.post(`${API_BASE}/api/auth/reset-password`, {
        token,
        newPassword,
      });
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Password reset failed');
    }
  }
}

export default new AuthService();
