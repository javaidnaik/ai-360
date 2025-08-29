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

      const isPasswordValid = comparePassword(credentials.password, user.passwordHash);
      if (!isPasswordValid) {
        return { success: false, message: 'Invalid email or password' };
      }

      // Update last login
      await db.updateUserLastLogin(user.id);

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
    return this.authState.user?.role === 'superadmin';
  }

  async createSuperAdmin(): Promise<void> {
    try {
      const existingAdmin = await db.getUserByEmail('admin@pixshop.com');
      if (!existingAdmin) {
        const passwordHash = hashPassword('admin123!');
        const adminUser: Omit<User, 'id'> = {
          email: 'admin@pixshop.com',
          passwordHash,
          firstName: 'Super',
          lastName: 'Admin',
          role: 'superadmin',
          createdAt: Date.now()
        };
        await db.addUser(adminUser);
        console.log('Super admin created: admin@pixshop.com / admin123!');
      }
    } catch (error) {
      console.error('Error creating super admin:', error);
    }
  }
}

export const authService = AuthService.getInstance();
