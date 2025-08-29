/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

export interface VideoCreation {
    id: number;
    prompt: string;
    videoBlob: Blob;
    timestamp: number;
    url: string; // Blob URL for easy display
    userId?: number; // Optional for backward compatibility
}

export interface User {
    id: number;
    email: string;
    passwordHash: string;
    firstName: string;
    lastName: string;
    role: 'user' | 'superadmin';
    createdAt: number;
    lastLogin?: number;
}

export interface AuthState {
    isAuthenticated: boolean;
    user: User | null;
    token: string | null;
}

export interface LoginCredentials {
    email: string;
    password: string;
}

export interface SignupCredentials {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
}

export interface AIModelConfig {
    id: number;
    name: string;
    modelId: string;
    apiKey: string;
    isActive: boolean;
    createdAt: number;
}

export interface UserAnalytics {
    totalUsers: number;
    activeUsers: number;
    totalVideos: number;
    videosToday: number;
    videosThisWeek: number;
    videosThisMonth: number;
}
