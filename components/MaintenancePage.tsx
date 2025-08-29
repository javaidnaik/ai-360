/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { SparklesIcon } from './icons';

interface MaintenancePageProps {
  maintenanceTitle?: string;
  maintenanceMessage?: string;
  estimatedCompletion?: Date;
}

const MaintenancePage: React.FC<MaintenancePageProps> = ({
  maintenanceTitle = 'Site Under Maintenance',
  maintenanceMessage = 'We are currently performing scheduled maintenance. Please check back soon.',
  estimatedCompletion
}) => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTimeRemaining = (targetDate: Date) => {
    const now = currentTime;
    const difference = targetDate.getTime() - now.getTime();
    
    if (difference <= 0) {
      return 'Maintenance should be completed soon';
    }
    
    const hours = Math.floor(difference / (1000 * 60 * 60));
    const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `Estimated completion in ${hours}h ${minutes}m`;
    } else {
      return `Estimated completion in ${minutes}m`;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-indigo-900 flex items-center justify-center p-4">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full opacity-20">
          <div className="w-96 h-96 bg-blue-500 rounded-full blur-3xl animate-pulse"></div>
        </div>
        <div className="absolute -bottom-1/2 -right-1/2 w-full h-full opacity-20">
          <div className="w-96 h-96 bg-purple-500 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        </div>
      </div>

      <div className="relative z-10 max-w-2xl mx-auto text-center">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <SparklesIcon className="w-12 h-12 text-blue-400 animate-spin" style={{ animationDuration: '3s' }} />
          <h1 className="text-4xl font-bold tracking-tight text-gray-100">
            Pixshop
          </h1>
        </div>

        {/* Maintenance Icon */}
        <div className="mb-8">
          <div className="w-24 h-24 mx-auto bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mb-6 animate-bounce">
            <svg className="w-12 h-12 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008z" />
            </svg>
          </div>
        </div>

        {/* Title */}
        <h2 className="text-5xl font-extrabold text-white mb-6 animate-fade-in">
          {maintenanceTitle}
        </h2>

        {/* Message */}
        <p className="text-xl text-gray-300 mb-8 leading-relaxed animate-fade-in" style={{ animationDelay: '0.5s' }}>
          {maintenanceMessage}
        </p>

        {/* Estimated completion time */}
        {estimatedCompletion && (
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 mb-8 border border-white/20 animate-fade-in" style={{ animationDelay: '1s' }}>
            <h3 className="text-lg font-semibold text-white mb-2">Maintenance Status</h3>
            <p className="text-gray-300">{formatTimeRemaining(estimatedCompletion)}</p>
            <div className="mt-4">
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full animate-pulse"
                  style={{ width: '60%' }}
                ></div>
              </div>
            </div>
          </div>
        )}

        {/* Features during maintenance */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white/5 backdrop-blur-sm rounded-lg p-4 border border-white/10 animate-fade-in" style={{ animationDelay: '1.5s' }}>
            <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center mb-3 mx-auto">
              <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h4 className="font-medium text-white mb-1">Secure Updates</h4>
            <p className="text-sm text-gray-400">Your data remains safe during maintenance</p>
          </div>

          <div className="bg-white/5 backdrop-blur-sm rounded-lg p-4 border border-white/10 animate-fade-in" style={{ animationDelay: '2s' }}>
            <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center mb-3 mx-auto">
              <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h4 className="font-medium text-white mb-1">Performance Boost</h4>
            <p className="text-sm text-gray-400">Faster AI processing coming soon</p>
          </div>

          <div className="bg-white/5 backdrop-blur-sm rounded-lg p-4 border border-white/10 animate-fade-in" style={{ animationDelay: '2.5s' }}>
            <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center mb-3 mx-auto">
              <SparklesIcon className="w-5 h-5 text-purple-400" />
            </div>
            <h4 className="font-medium text-white mb-1">New Features</h4>
            <p className="text-sm text-gray-400">Enhanced AI capabilities being added</p>
          </div>
        </div>

        {/* Contact info */}
        <div className="text-center animate-fade-in" style={{ animationDelay: '3s' }}>
          <p className="text-gray-400 mb-4">
            Need immediate assistance? Contact our support team.
          </p>
          <div className="flex items-center justify-center gap-4">
            <a 
              href="mailto:support@pixshop.com" 
              className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg font-medium transition-colors border border-white/20"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Email Support
            </a>
            <button 
              onClick={() => window.location.reload()} 
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 rounded-lg font-medium transition-colors border border-blue-500/30"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh Page
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 pt-8 border-t border-white/10">
          <p className="text-sm text-gray-500">
            © 2024 Pixshop. Thank you for your patience during maintenance.
          </p>
        </div>
      </div>
    </div>
  );
};

export default MaintenancePage;
