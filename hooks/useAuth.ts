'use client';

import { useAuthContext } from '@/context/AuthContext';

export default function useAuth() {
  const { user, token, isLoading, isAuthenticated, logout, login } = useAuthContext();
  
  return {
    user,
    token,
    loading: isLoading,
    isAuthenticated,
    logout,
    login,
  };
}
