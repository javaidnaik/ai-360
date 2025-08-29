/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';

const MaintenancePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-indigo-900 flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center">
        <div className="bg-black/20 backdrop-blur-sm border border-gray-700/50 rounded-lg p-8">
          {/* Maintenance Icon */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              <svg className="w-20 h-20 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <div className="absolute -top-2 -right-2">
                <div className="animate-ping absolute inline-flex h-4 w-4 rounded-full bg-yellow-400 opacity-75"></div>
                <div className="relative inline-flex rounded-full h-4 w-4 bg-yellow-500"></div>
              </div>
            </div>
          </div>

          {/* Title */}
          <h1 className="text-3xl font-bold text-white mb-4">
            Site Under Maintenance
          </h1>

          {/* Message */}
          <div className="space-y-4 text-gray-300">
            <p className="text-lg">
              We're currently performing scheduled maintenance to improve your experience.
            </p>
            <p className="text-sm">
              The site is temporarily unavailable for regular users. Please check back later.
            </p>
          </div>

          {/* Admin Access Note */}
          <div className="mt-8 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <div className="flex items-center justify-center gap-2 mb-2">
              <svg className="w-5 h-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <span className="text-blue-300 font-medium text-sm">Administrator Access</span>
            </div>
            <p className="text-blue-200 text-xs">
              If you're a system administrator, you can still access the{' '}
              <a href="/superadmin" className="text-blue-400 hover:text-blue-300 underline font-medium">
                Super Admin Dashboard
              </a>
            </p>
          </div>

          {/* Contact Info */}
          <div className="mt-6 pt-6 border-t border-gray-700/50">
            <p className="text-gray-400 text-sm">
              Questions? Contact your system administrator.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MaintenancePage;
