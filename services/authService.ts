/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User, LoginCredentials, SignupCredentials, AuthState } from '../types';
import * as db from './db';

const JWT_SECRET = 'pixshop-jwt-secret-key-2024'; // In production, use environment variable
const TOKEN_EXPIRY = '7d';

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
        const decoded = jwt.verify(token, JWT_SECRET) as any;
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

      // Hash password
      const passwordHash = await bcrypt.hash(credentials.password, 12);

      // Create user
      const newUser: Omit<User, 'id'> = {
        email: credentials.email,
        passwordHash,
        firstName: credentials.firstName,
        lastName: credentials.lastName,
        role: 'user',
        createdAt: Date.now()
      };

      const userId = await db.addUser(newUser);
      const user = await db.getUserById(userId);
      
      if (!user) {
        return { success: false, message: 'Failed to create user' };
      }

      // Generate token
      const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });

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

      const isPasswordValid = await bcrypt.compare(credentials.password, user.passwordHash);
      if (!isPasswordValid) {
        return { success: false, message: 'Invalid email or password' };
      }

      // Update last login
      await db.updateUserLastLogin(user.id);

      // Generate token
      const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });

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
        const passwordHash = await bcrypt.hash('admin123!', 12);
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
