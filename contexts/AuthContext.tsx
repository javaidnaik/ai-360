/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { AuthState, User, LoginCredentials, SignupCredentials } from '../types';
import { authService } from '../services/authService';

interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<{ success: boolean; message: string }>;
  signup: (credentials: SignupCredentials) => Promise<{ success: boolean; message: string }>;
  logout: () => void;
  isSuperAdmin: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    token: null
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      try {
        // Initialize auth service and create super admin if needed
        await authService.createSuperAdmin();
        
        // Get current auth state
        const currentAuthState = authService.getAuthState();
        setAuthState(currentAuthState);
      } catch (error) {
        console.error('Auth initialization error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (credentials: LoginCredentials) => {
    const result = await authService.login(credentials);
    if (result.success) {
      setAuthState(authService.getAuthState());
    }
    return { success: result.success, message: result.message };
  };

  const signup = async (credentials: SignupCredentials) => {
    const result = await authService.signup(credentials);
    if (result.success) {
      setAuthState(authService.getAuthState());
    }
    return { success: result.success, message: result.message };
  };

  const logout = () => {
    authService.logout();
    setAuthState(authService.getAuthState());
  };

  const isSuperAdmin = () => {
    return authService.isSuperAdmin();
  };

  const value: AuthContextType = {
    ...authState,
    login,
    signup,
    logout,
    isSuperAdmin
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
