/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleAuth } from 'google-auth-library';
import { drive_v3, google } from 'googleapis';

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
  private drive: drive_v3.Drive | null = null;
  private auth: GoogleAuth | null = null;
  private isAuthenticated = false;

  private constructor() {}

  static getInstance(): GoogleDriveService {
    if (!GoogleDriveService.instance) {
      GoogleDriveService.instance = new GoogleDriveService();
    }
    return GoogleDriveService.instance;
  }

  /**
   * Initialize Google Drive API with user authentication
   */
  async authenticate(): Promise<boolean> {
    try {
      // For browser-based authentication, we'll use Google's OAuth2 flow
      const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
      const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;
      
      if (!CLIENT_ID || !API_KEY || CLIENT_ID === 'your-google-client-id' || API_KEY === 'your-google-api-key') {
        throw new Error('Google Drive API credentials not configured. Please set VITE_GOOGLE_CLIENT_ID and VITE_GOOGLE_API_KEY environment variables.');
      }
      
      // Load Google API
      await this.loadGoogleAPI();
      
      // Initialize the API
      await new Promise<void>((resolve, reject) => {
        gapi.load('auth2:client', {
          callback: resolve,
          onerror: reject
        });
      });

      await gapi.client.init({
        apiKey: API_KEY,
        clientId: CLIENT_ID,
        discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],
        scope: 'https://www.googleapis.com/auth/drive.file'
      });

      const authInstance = gapi.auth2.getAuthInstance();
      
      if (!authInstance.isSignedIn.get()) {
        await authInstance.signIn();
      }

      this.isAuthenticated = authInstance.isSignedIn.get();
      return this.isAuthenticated;
    } catch (error) {
      console.error('Google Drive authentication failed:', error);
      return false;
    }
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
   * Check if user is authenticated with Google Drive
   */
  isUserAuthenticated(): boolean {
    return this.isAuthenticated && typeof gapi !== 'undefined' && 
           gapi.auth2 && gapi.auth2.getAuthInstance().isSignedIn.get();
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

      const request = gapi.client.request({
        path: 'https://www.googleapis.com/upload/drive/v3/files',
        method: 'POST',
        params: { uploadType: 'multipart' },
        headers: {
          'Content-Type': 'multipart/related; boundary="' + boundary + '"'
        },
        body: body
      });

      const response = await request;
      
      // Get the file details with sharing link
      const fileDetails = await gapi.client.drive.files.get({
        fileId: response.result.id,
        fields: 'id,name,webViewLink,webContentLink,createdTime,size'
      });

      // Make the file shareable (view access to anyone with the link)
      await gapi.client.drive.permissions.create({
        fileId: response.result.id,
        resource: {
          role: 'reader',
          type: 'anyone'
        }
      });

      return {
        id: fileDetails.result.id!,
        name: fileDetails.result.name!,
        webViewLink: fileDetails.result.webViewLink,
        webContentLink: fileDetails.result.webContentLink,
        createdTime: fileDetails.result.createdTime,
        size: fileDetails.result.size
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
    const searchResponse = await gapi.client.drive.files.list({
      q: `name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
      fields: 'files(id,name)'
    });

    if (searchResponse.result.files && searchResponse.result.files.length > 0) {
      return searchResponse.result.files[0].id!;
    }

    // Create new folder
    const createResponse = await gapi.client.drive.files.create({
      resource: {
        name: folderName,
        mimeType: 'application/vnd.google-apps.folder'
      },
      fields: 'id'
    });

    return createResponse.result.id!;
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

      const response = await gapi.client.drive.files.list({
        q: `'${folderId}' in parents and mimeType='video/mp4' and trashed=false`,
        fields: 'files(id,name,webViewLink,webContentLink,createdTime,size)',
        orderBy: 'createdTime desc'
      });

      return response.result.files?.map(file => ({
        id: file.id!,
        name: file.name!,
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
      await gapi.client.drive.files.delete({
        fileId: fileId
      });
      return true;
    } catch (error) {
      console.error('Failed to delete video:', error);
      return false;
    }
  }

  /**
   * Sign out from Google Drive
   */
  async signOut(): Promise<void> {
    if (typeof gapi !== 'undefined' && gapi.auth2) {
      const authInstance = gapi.auth2.getAuthInstance();
      await authInstance.signOut();
      this.isAuthenticated = false;
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

// Global declaration for Google API
declare global {
  const gapi: any;
}

export const googleDriveService = GoogleDriveService.getInstance();
