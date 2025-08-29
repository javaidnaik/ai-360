/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import CryptoJS from 'crypto-js';
import { User, LoginCredentials, SignupCredentials, AuthState } from '../types';
import * as db from './supabaseDb';

const JWT_SECRET = 'pixshop-jwt-secret-key-2024'; // In production, use environment variable
const TOKEN_EXPIRY = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

// Simple JWT-like token creation and verification using browser-compatible crypto
const createToken = (payload: any): string => {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = btoa(JSON.stringify({ ...payload, exp: Date.now() + TOKEN_EXPIRY }));
  const signature = CryptoJS.HmacSHA256(`${header}.${body}`, JWT_SECRET).toString();
  return `${header}.${body}.${signature}`;
};

const verifyToken = (token: string): any => {
  try {
    const [header, body, signature] = token.split('.');
    const expectedSignature = CryptoJS.HmacSHA256(`${header}.${body}`, JWT_SECRET).toString();
    
    if (signature !== expectedSignature) {
      throw new Error('Invalid signature');
    }
    
    const payload = JSON.parse(atob(body));
    if (payload.exp < Date.now()) {
      throw new Error('Token expired');
    }
    
    return payload;
  } catch (error) {
    throw new Error('Invalid token');
  }
};

const hashPassword = (password: string): string => {
  return CryptoJS.SHA256(password + JWT_SECRET).toString();
};

const comparePassword = (password: string, hash: string): boolean => {
  return hashPassword(password) === hash;
};

export class AuthService {
  private static instance: AuthService;
  private authState: AuthState = {
    isAuthenticated: false,
    user: null,
    token: null
  };

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  constructor() {
    this.initializeAuth();
  }

  private async initializeAuth(): Promise<void> {
    const token = localStorage.getItem('auth_token');
    if (token) {
      try {
        const decoded = verifyToken(token);
        const user = await db.getUserById(decoded.userId);
        if (user) {
          this.authState = {
            isAuthenticated: true,
            user,
            token
          };
        } else {
          localStorage.removeItem('auth_token');
        }
      } catch (error) {
        localStorage.removeItem('auth_token');
      }
    }
  }

  async signup(credentials: SignupCredentials): Promise<{ success: boolean; message: string; user?: User }> {
    try {
      // Check if user already exists
      const existingUser = await db.getUserByEmail(credentials.email);
      if (existingUser) {
        return { success: false, message: 'User with this email already exists' };
      }

      // Create new user using Supabase
      const user = await db.createUser(credentials.email, credentials.password, 'user', credentials.firstName, credentials.lastName);

      // Generate token
      const token = createToken({ userId: user.id });

      // Update auth state
      this.authState = {
        isAuthenticated: true,
        user,
        token
      };

      // Store token
      localStorage.setItem('auth_token', token);

      return { success: true, message: 'User created successfully', user };
    } catch (error) {
      console.error('Signup error:', error);
      return { success: false, message: 'Failed to create user' };
    }
  }

  async login(credentials: LoginCredentials): Promise<{ success: boolean; message: string; user?: User }> {
    try {
      const user = await db.getUserByEmail(credentials.email);
      if (!user) {
        return { success: false, message: 'Invalid email or password' };
      }

      // Validate password using Supabase function
      const validUser = await db.validateUser(credentials.email, credentials.password);
      if (!validUser) {
        return { success: false, message: 'Invalid email or password' };
      }

      // Update last login is handled in validateUser function

      // Generate token
      const token = createToken({ userId: user.id });

      // Update auth state
      this.authState = {
        isAuthenticated: true,
        user: { ...user, lastLogin: Date.now() },
        token
      };

      // Store token
      localStorage.setItem('auth_token', token);

      return { success: true, message: 'Login successful', user };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, message: 'Login failed' };
    }
  }

  logout(): void {
    this.authState = {
      isAuthenticated: false,
      user: null,
      token: null
    };
    localStorage.removeItem('auth_token');
  }

  async forgotPassword(email: string): Promise<{ success: boolean; message: string }> {
    try {
      const token = await db.createPasswordResetToken(email);
      if (!token) {
        return { success: false, message: 'No account found with this email address' };
      }
      
      // In a real app, you would send an email with the reset link
      // For demo purposes, we'll log the token
      console.log('Password reset token:', token);
      console.log('Reset link would be: /reset-password?token=' + token);
      
      return { 
        success: true, 
        message: 'Password reset instructions have been sent to your email (check console for demo)' 
      };
    } catch (error) {
      console.error('Forgot password error:', error);
      return { success: false, message: 'Failed to process password reset request' };
    }
  }

  async resetPassword(token: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    try {
      const success = await db.resetPassword(token, newPassword);
      if (success) {
        return { success: true, message: 'Password has been reset successfully' };
      } else {
        return { success: false, message: 'Invalid or expired reset token' };
      }
    } catch (error) {
      console.error('Reset password error:', error);
      return { success: false, message: 'Failed to reset password' };
    }
  }

  getAuthState(): AuthState {
    return { ...this.authState };
  }

  isAuthenticated(): boolean {
    return this.authState.isAuthenticated;
  }

  getCurrentUser(): User | null {
    return this.authState.user;
  }

  isSuperAdmin(): boolean {
    return this.authState.user?.role === 'super_admin';
  }

  async createSuperAdmin(): Promise<void> {
    try {
      // Use the Supabase initialization function instead
      await db.initializeDefaultSuperAdmin();
    } catch (error) {
      console.error('Error creating super admin:', error);
    }
  }
}

export const authService = AuthService.getInstance();
