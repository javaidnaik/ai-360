/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// No longer need googleapis - using browser-compatible Google APIs

export interface DriveFile {
  id: string;
  name: string;
  webViewLink?: string;
  webContentLink?: string;
  createdTime?: string;
  size?: string;
}

export class GoogleDriveService {
  private static instance: GoogleDriveService;
  private currentUserId: number | null = null;
  private currentToken: string | null = null;
  private isAuthenticated: boolean = false;
  private readonly TOKEN_STORAGE_KEY = 'google_drive_token';

  private constructor() {}

  static getInstance(): GoogleDriveService {
    if (!GoogleDriveService.instance) {
      GoogleDriveService.instance = new GoogleDriveService();
    }
    return GoogleDriveService.instance;
  }

  /**
   * Set the current user and load their Google Drive token from database
   */
  async setCurrentUser(userId: number): Promise<void> {
    this.currentUserId = userId;
    await this.loadUserToken();
  }

  /**
   * Clear current user and authentication state
   */
  clearUser(): void {
    this.currentUserId = null;
    this.currentToken = null;
    this.isAuthenticated = false;
    
    // Clear gapi token if available
    if (typeof gapi !== 'undefined' && gapi.client) {
      gapi.client.setToken(null);
    }
  }

  /**
   * Load user's Google Drive token from database
   */
  private async loadUserToken(): Promise<void> {
    if (!this.currentUserId) {
      this.currentToken = null;
      this.isAuthenticated = false;
      return;
    }

    try {
      // Import db dynamically to avoid circular imports
      const { getUserSettings } = await import('./supabaseDb');
      const settings = await getUserSettings(this.currentUserId);
      this.currentToken = settings.googleDriveToken;
      
      // If we have a token, validate it
      if (this.currentToken) {
        const isValid = await this.validateToken(this.currentToken);
        this.isAuthenticated = isValid;
        
        if (isValid) {
          console.log('✅ Valid Google Drive token found in database');
        } else {
          console.log('❌ Invalid Google Drive token found, clearing...');
          await this.clearInvalidToken();
        }
      } else {
        this.isAuthenticated = false;
      }
    } catch (error) {
      console.error('Failed to load Google Drive token from database:', error);
      this.currentToken = null;
      this.isAuthenticated = false;
    }
  }

  /**
   * Validate if a token is still valid by making a test API call
   */
  private async validateToken(token: string): Promise<boolean> {
    try {
      const response = await fetch('https://www.googleapis.com/drive/v3/about?fields=user', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      return response.ok;
    } catch (error) {
      console.error('Token validation failed:', error);
      return false;
    }
  }

  /**
   * Clear invalid token from database
   */
  private async clearInvalidToken(): Promise<void> {
    if (!this.currentUserId) return;

    try {
      const { updateUserSettings } = await import('./supabaseDb');
      await updateUserSettings(this.currentUserId, {
        googleDriveToken: undefined,
        googleDriveRefreshToken: undefined,
        googleDriveConnected: false
      });
      this.currentToken = null;
      this.isAuthenticated = false;
    } catch (error) {
      console.error('Failed to clear invalid token:', error);
    }
  }

  /**
   * Save user's Google Drive token to database
   */
  private async saveUserToken(token: string, refreshToken?: string): Promise<void> {
    if (!this.currentUserId) return;

    try {
      const { updateUserSettings } = await import('./supabaseDb');
      await updateUserSettings(this.currentUserId, {
        googleDriveToken: token,
        googleDriveRefreshToken: refreshToken,
        googleDriveConnected: true
      });
      this.currentToken = token;
      this.isAuthenticated = true;
    } catch (error) {
      console.error('Failed to save Google Drive token to database:', error);
    }
  }



  /**
   * Save authentication token to localStorage
   */
  private saveTokenToStorage(tokenResponse: any): void {
    try {
      const tokenData = {
        access_token: tokenResponse.access_token,
        expires_at: Date.now() + (tokenResponse.expires_in * 1000), // Convert to timestamp
        scope: tokenResponse.scope,
        token_type: tokenResponse.token_type
      };
      localStorage.setItem(this.TOKEN_STORAGE_KEY, JSON.stringify(tokenData));
      console.log('💾 Google Drive token saved to storage');
    } catch (error) {
      console.error('Error saving token to storage:', error);
    }
  }

  /**
   * Get stored token for API calls
   */
  private getStoredToken(): any {
    try {
      const storedToken = localStorage.getItem(this.TOKEN_STORAGE_KEY);
      if (storedToken) {
        const tokenData = JSON.parse(storedToken);
        if (tokenData.expires_at && tokenData.expires_at > Date.now()) {
          return tokenData;
        }
      }
    } catch (error) {
      console.error('Error getting stored token:', error);
    }
    return null;
  }

  /**
   * Initialize Google Drive API with user authentication using Google Identity Services
   */
  async authenticate(): Promise<boolean> {
    try {
      // Check if we already have a valid token for current user
      if (this.isAuthenticated && this.currentToken && this.currentUserId) {
        console.log('🔄 Using stored Google Drive token from database');
        await this.initializeGoogleAPI();
        gapi.client.setToken({ access_token: this.currentToken });
        return true;
      }

      // For browser-based authentication, we'll use Google's newer Identity Services
      const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
      const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;
      
      console.log('🔧 Debug - CLIENT_ID loaded:', CLIENT_ID ? 'YES' : 'NO');
      console.log('🔧 Debug - API_KEY loaded:', API_KEY ? 'YES' : 'NO');
      
      if (!CLIENT_ID || !API_KEY || CLIENT_ID === 'your-google-client-id' || API_KEY === 'your-google-api-key') {
        throw new Error('Google Drive API credentials not configured. Please set VITE_GOOGLE_CLIENT_ID and VITE_GOOGLE_API_KEY environment variables.');
      }
      
      // Load Google APIs and Identity Services
      await this.loadGoogleAPI();
      await this.loadGoogleIdentityServices();
      await this.initializeGoogleAPI();

      // Use Google Identity Services for authentication
      const tokenResponse = await new Promise<any>((resolve, reject) => {
        const tokenClient = google.accounts.oauth2.initTokenClient({
          client_id: CLIENT_ID,
          scope: 'https://www.googleapis.com/auth/drive.file',
          callback: (response: any) => {
            if (response.error) {
              reject(response);
            } else {
              resolve(response);
            }
          }
        });
        tokenClient.requestAccessToken();
      });

      // Set the access token for API calls
      gapi.client.setToken(tokenResponse);
      
      // Save token to localStorage for persistence
      // Save the token to database for current user
      await this.saveUserToken(tokenResponse.access_token, tokenResponse.refresh_token);
      
      console.log('✅ Google Drive authentication successful and saved to database');
      return true;
    } catch (error) {
      console.error('Google Drive authentication failed:', error);
      return false;
    }
  }

  /**
   * Initialize Google API client
   */
  private async initializeGoogleAPI(): Promise<void> {
    const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;
    
    await new Promise<void>((resolve, reject) => {
      gapi.load('client', {
        callback: resolve,
        onerror: reject
      });
    });

    await gapi.client.init({
      apiKey: API_KEY
    });
  }

  /**
   * Load Google API script dynamically
   */
  private loadGoogleAPI(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (typeof gapi !== 'undefined') {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://apis.google.com/js/api.js';
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Google API'));
      document.head.appendChild(script);
    });
  }

  /**
   * Load Google Identity Services script dynamically
   */
  private loadGoogleIdentityServices(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (typeof google !== 'undefined' && google.accounts) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Google Identity Services'));
      document.head.appendChild(script);
    });
  }

  /**
   * Sign out from Google Drive and clear all tokens
   */
  async signOut(): Promise<void> {
    try {
      // Clear tokens from database
      if (this.currentUserId) {
        const { updateUserSettings } = await import('./supabaseDb');
        await updateUserSettings(this.currentUserId, {
          googleDriveToken: undefined,
          googleDriveRefreshToken: undefined,
          googleDriveConnected: false
        });
      }

      // Clear local state
      this.clearUser();
      
      // Clear localStorage token
      localStorage.removeItem(this.TOKEN_STORAGE_KEY);
      
      console.log('✅ Signed out from Google Drive');
    } catch (error) {
      console.error('Error during sign out:', error);
    }
  }

  /**
   * Check if user is authenticated with Google Drive
   */
  isUserAuthenticated(): boolean {
    // Primary check: do we have a validated token for the current user?
    return this.isAuthenticated && this.currentToken !== null && this.currentUserId !== null;
  }

  /**
   * Get access token for API calls
   */
  private getAccessToken(): string {
    // Try to get token from gapi client first
    if (typeof gapi !== 'undefined' && gapi.client && gapi.client.getToken()) {
      return gapi.client.getToken().access_token;
    }

    // Fallback to stored token
    const storedToken = this.getStoredToken();
    if (storedToken) {
      return storedToken.access_token;
    }

    throw new Error('No access token available');
  }

  /**
   * Upload a video file to Google Drive
   */
  async uploadVideo(
    videoBlob: Blob, 
    fileName: string, 
    userId: number,
    onProgress?: (progress: number) => void
  ): Promise<DriveFile> {
    if (!this.isUserAuthenticated()) {
      throw new Error('Not authenticated with Google Drive');
    }

    try {
      const folderName = `Pixshop_Videos_User_${userId}`;
      const folderId = await this.getOrCreateFolder(folderName);

      const metadata = {
        name: fileName,
        parents: [folderId],
        description: `360° video created with Pixshop on ${new Date().toISOString()}`
      };

      // Convert blob to base64 for upload
      const base64Data = await this.blobToBase64(videoBlob);
      const boundary = '-------314159265358979323846';
      const delimiter = "\r\n--" + boundary + "\r\n";
      const close_delim = "\r\n--" + boundary + "--";

      const body = delimiter +
        'Content-Type: application/json\r\n\r\n' +
        JSON.stringify(metadata) +
        delimiter +
        'Content-Type: video/mp4\r\n' +
        'Content-Transfer-Encoding: base64\r\n\r\n' +
        base64Data +
        close_delim;

             // Upload using direct fetch API
       const uploadResponse = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
         method: 'POST',
         headers: {
           'Authorization': `Bearer ${this.getAccessToken()}`,
           'Content-Type': 'multipart/related; boundary="' + boundary + '"'
         },
         body: body
       });

       if (!uploadResponse.ok) {
         throw new Error(`Upload failed: ${uploadResponse.status}`);
       }

       const uploadResult = await uploadResponse.json();
       
       // Get the file details with sharing link
       const fileDetailsResponse = await fetch(`https://www.googleapis.com/drive/v3/files/${uploadResult.id}?fields=id,name,webViewLink,webContentLink,createdTime,size`, {
         headers: {
           'Authorization': `Bearer ${gapi.client.getToken().access_token}`
         }
       });

       const fileDetails = await fileDetailsResponse.json();

       // Make the file shareable (view access to anyone with the link)
       await fetch(`https://www.googleapis.com/drive/v3/files/${uploadResult.id}/permissions`, {
         method: 'POST',
         headers: {
           'Authorization': `Bearer ${this.getAccessToken()}`,
           'Content-Type': 'application/json'
         },
         body: JSON.stringify({
           role: 'reader',
           type: 'anyone'
         })
       });

      return {
        id: fileDetails.id,
        name: fileDetails.name,
        webViewLink: fileDetails.webViewLink,
        webContentLink: fileDetails.webContentLink,
        createdTime: fileDetails.createdTime,
        size: fileDetails.size
      };
    } catch (error) {
      console.error('Failed to upload video to Google Drive:', error);
      throw new Error('Failed to upload video to Google Drive');
    }
  }

  /**
   * Get or create a folder for user's videos
   */
  private async getOrCreateFolder(folderName: string): Promise<string> {
    // Search for existing folder
    const searchUrl = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(`name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`)}&fields=files(id,name)`;
    const searchResponse = await fetch(searchUrl, {
      headers: {
        'Authorization': `Bearer ${gapi.client.getToken().access_token}`
      }
    });

    const searchResult = await searchResponse.json();
    if (searchResult.files && searchResult.files.length > 0) {
      return searchResult.files[0].id;
    }

    // Create new folder
    const createResponse = await fetch('https://www.googleapis.com/drive/v3/files?fields=id', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${gapi.client.getToken().access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: folderName,
        mimeType: 'application/vnd.google-apps.folder'
      })
    });

    const createResult = await createResponse.json();
    return createResult.id;
  }

  /**
   * Get list of user's videos from Google Drive
   */
  async getUserVideos(userId: number): Promise<DriveFile[]> {
    if (!this.isUserAuthenticated()) {
      return [];
    }

    try {
      const folderName = `Pixshop_Videos_User_${userId}`;
      const folderId = await this.getOrCreateFolder(folderName);

      const listUrl = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(`'${folderId}' in parents and mimeType='video/mp4' and trashed=false`)}&fields=files(id,name,webViewLink,webContentLink,createdTime,size)&orderBy=createdTime desc`;
      const response = await fetch(listUrl, {
        headers: {
          'Authorization': `Bearer ${gapi.client.getToken().access_token}`
        }
      });

      const result = await response.json();
      return result.files?.map((file: any) => ({
        id: file.id,
        name: file.name,
        webViewLink: file.webViewLink,
        webContentLink: file.webContentLink,
        createdTime: file.createdTime,
        size: file.size
      })) || [];
    } catch (error) {
      console.error('Failed to get user videos:', error);
      return [];
    }
  }

  /**
   * Delete a video from Google Drive
   */
  async deleteVideo(fileId: string): Promise<boolean> {
    if (!this.isUserAuthenticated()) {
      throw new Error('Not authenticated with Google Drive');
    }

    try {
      const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${gapi.client.getToken().access_token}`
        }
      });
      return response.ok;
    } catch (error) {
      console.error('Failed to delete video:', error);
      return false;
    }
  }



  /**
   * Convert Blob to base64 string
   */
  private blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1]; // Remove data:video/mp4;base64, prefix
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }
}

// Global declarations for Google APIs
declare global {
  const gapi: any;
  const google: any;
}

export const googleDriveService = GoogleDriveService.getInstance();
