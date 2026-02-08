'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

interface User {
  _id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'TESTER' | 'DEVELOPER';
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  logout: () => void;
  login: (user: User, token: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize auth on mount
  useEffect(() => {
    const initAuth = () => {
      try {
        console.log('[v0] Initializing auth context...');
        
        // Check for stored credentials
        const storedUser = localStorage.getItem('user');
        const storedToken = localStorage.getItem('token');
        
        if (storedUser && storedToken) {
          try {
            const parsedUser = JSON.parse(storedUser) as User;
            
            // Validate user object has required fields
            if (parsedUser._id && parsedUser.email && parsedUser.role) {
              console.log('[v0] Found valid stored credentials for:', parsedUser.email);
              setUser(parsedUser);
              setToken(storedToken);
            } else {
              console.warn('[v0] Stored user data is invalid, clearing...');
              localStorage.removeItem('user');
              localStorage.removeItem('token');
            }
          } catch (parseError) {
            console.error('[v0] Failed to parse stored user data:', parseError);
            localStorage.removeItem('user');
            localStorage.removeItem('token');
            setUser(null);
            setToken(null);
          }
        } else {
          console.log('[v0] No stored credentials found');
        }
      } catch (error) {
        console.error('[v0] Auth initialization error:', error);
        setUser(null);
        setToken(null);
      } finally {
        setIsLoading(false);
        console.log('[v0] Auth initialization complete');
      }
    };

    // Initialize immediately - no artificial delay
    // The previous 100ms delay was causing the landing page to not display
    initAuth();
  }, []);

  /**
   * Log in a user by storing credentials in state and localStorage
   */
  const login = (newUser: User, newToken: string) => {
    console.log('[v0] Logging in user:', newUser.email);
    
    setUser(newUser);
    setToken(newToken);
    
    // Persist to localStorage
    try {
      localStorage.setItem('user', JSON.stringify(newUser));
      localStorage.setItem('token', newToken);
      console.log('[v0] Credentials saved to localStorage');
    } catch (error) {
      console.error('[v0] Failed to save credentials to localStorage:', error);
    }
  };

  /**
   * Log out by clearing all auth state and localStorage
   */
  const logout = () => {
    console.log('[v0] Logging out user');
    
    setUser(null);
    setToken(null);
    
    // Clear localStorage
    try {
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      console.log('[v0] Credentials cleared from localStorage');
    } catch (error) {
      console.error('[v0] Failed to clear localStorage:', error);
    }
  };

  const value: AuthContextType = {
    user,
    token,
    isLoading,
    isAuthenticated: !!user && !!token,
    logout,
    login,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook to access auth context
 * Must be used within an AuthProvider
 */
export function useAuthContext() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within AuthProvider');
  }
  return context;
}