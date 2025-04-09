import jwtDecode from 'jwt-decode';
import { nhost } from '../App';

interface JwtPayload {
  exp: number;
  sub: string;
  [key: string]: any;
}

export const authService = {
  /**
   * Get the current JWT token from localStorage
   */
  getToken: (): string | null => {
    // Try to get from our custom storage first
    const token = localStorage.getItem('nhost-jwt-token');
    if (token) return token;
    
    // Fallback to nhost's auth system
    return nhost.auth.getAccessToken();
  },

  /**
   * Store JWT token in localStorage
   */
  storeToken: (token: string): void => {
    localStorage.setItem('nhost-jwt-token', token);
    
    try {
      const decoded = jwtDecode<JwtPayload>(token);
      const expiryDate = new Date(decoded.exp * 1000);
      localStorage.setItem('nhost-token-expires', expiryDate.toISOString());
    } catch (error) {
      console.error('Failed to decode token for expiry setting', error);
    }
  },

  /**
   * Remove JWT token from localStorage
   */
  removeToken: (): void => {
    localStorage.removeItem('nhost-jwt-token');
    localStorage.removeItem('nhost-token-expires');
  },

  /**
   * Decode JWT token to get user info
   */
  decodeToken: (): JwtPayload | null => {
    const token = authService.getToken();
    if (!token) return null;
    
    try {
      return jwtDecode<JwtPayload>(token);
    } catch (error) {
      console.error('Failed to decode token', error);
      return null;
    }
  },

  /**
   * Check if user is authenticated (has a valid non-expired token)
   */
  isAuthenticated: (): boolean => {
    const token = authService.getToken();
    if (!token) return false;
    
    try {
      const decoded = jwtDecode<JwtPayload>(token);
      const currentTime = Date.now() / 1000;
      return decoded.exp > currentTime;
    } catch (error) {
      console.error('Error checking authentication status', error);
      return false;
    }
  },

  /**
   * Get user ID from token
   */
  getUserId: (): string | null => {
    const decoded = authService.decodeToken();
    return decoded?.sub || null;
  },

  /**
   * Get user roles from token
   */
  getUserRoles: (): string[] => {
    const decoded = authService.decodeToken();
    return decoded?.['https://hasura.io/jwt/claims']?.['x-hasura-allowed-roles'] || [];
  },

  /**
   * Log the current authentication status
   */
  logAuthStatus: (): void => {
    const token = authService.getToken();
    console.log('Current auth token:', token ? `${token.substring(0, 15)}...` : 'No token');
    
    const isAuth = authService.isAuthenticated();
    console.log('Is authenticated:', isAuth);
    
    if (isAuth) {
      const decoded = authService.decodeToken();
      console.log('Token payload:', decoded);
      
      const expiry = decoded?.exp ? new Date(decoded.exp * 1000).toLocaleString() : 'Unknown';
      console.log('Token expires:', expiry);
    }
  }
};

export default authService; 