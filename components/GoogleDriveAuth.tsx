/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { googleDriveService } from '../services/googleDriveService';

interface GoogleDriveAuthProps {
  onAuthSuccess: () => void;
  onAuthError: (error: string) => void;
}

const GoogleDriveAuth: React.FC<GoogleDriveAuthProps> = ({ onAuthSuccess, onAuthError }) => {
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingToken, setIsCheckingToken] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    setIsCheckingToken(true);
    try {
      // Check if user is already authenticated (token validation happens in setCurrentUser)
      const authenticated = googleDriveService.isUserAuthenticated();
      setIsAuthenticated(authenticated);
      
      if (authenticated) {
        onAuthSuccess();
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
    } finally {
      setIsCheckingToken(false);
    }
  };

  const handleAuthenticate = async () => {
    setIsAuthenticating(true);
    try {
      const success = await googleDriveService.authenticate();
      if (success) {
        setIsAuthenticated(true);
        onAuthSuccess();
      } else {
        onAuthError('Failed to authenticate with Google Drive');
      }
         } catch (error) {
       console.error('Authentication error:', error);
       
       let errorMessage = 'Authentication failed. ';
       if (error instanceof Error) {
         if (error.message.includes('credentials not configured')) {
           errorMessage = 'Google Drive API not configured. Please contact administrator.';
         } else if (error.message.includes('Not a valid origin')) {
           errorMessage = 'Domain not authorized. Please contact administrator to add this domain to Google OAuth settings.';
         } else if (error.message.includes('idpiframe_initialization_failed')) {
           errorMessage = 'Google API initialization failed. Please check domain configuration.';
         } else {
           errorMessage += error.message;
         }
       }
       
       onAuthError(errorMessage);
     } finally {
      setIsAuthenticating(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await googleDriveService.signOut();
      setIsAuthenticated(false);
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  // Show loading while checking existing token
  if (isCheckingToken) {
    return (
      <div className="bg-gray-500/10 border border-gray-500/20 rounded-lg p-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-400"></div>
          <div>
            <p className="text-gray-400 font-medium">Checking Google Drive connection...</p>
            <p className="text-gray-500 text-sm">Validating existing token</p>
          </div>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return (
      <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <div>
              <p className="text-green-400 font-medium">Connected to Google Drive</p>
              <p className="text-gray-400 text-sm">Your videos will be automatically saved to Google Drive</p>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="text-gray-400 hover:text-gray-300 text-sm underline"
          >
            Disconnect
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-6 mb-6">
      <div className="text-center">
        <div className="mb-4">
          <svg className="w-12 h-12 text-blue-400 mx-auto mb-3" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z"/>
          </svg>
          <h3 className="text-xl font-semibold text-white mb-2">Connect Google Drive</h3>
          <p className="text-gray-400 mb-4">
            Save your 360° videos to Google Drive for permanent storage and easy access from anywhere.
          </p>
        </div>

        <div className="bg-gray-800/50 rounded-lg p-4 mb-4">
          <h4 className="text-sm font-medium text-white mb-2">Benefits:</h4>
          <ul className="text-sm text-gray-300 space-y-1 text-left">
            <li>• Permanent cloud storage</li>
            <li>• Access videos from any device</li>
            <li>• Share videos with others</li>
            <li>• Automatic backup</li>
          </ul>
        </div>

        <button
          onClick={handleAuthenticate}
          disabled={isAuthenticating}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
        >
          {isAuthenticating ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              Connecting...
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z"/>
              </svg>
              Connect to Google Drive
            </>
          )}
        </button>

        <p className="text-xs text-gray-500 mt-3">
          We only request access to files created by this app. Your privacy is protected.
        </p>
      </div>
    </div>
  );
};

export default GoogleDriveAuth;
