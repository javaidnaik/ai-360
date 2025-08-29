/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import MaintenancePage from './MaintenancePage';
import * as db from '../services/supabaseDb';

interface MaintenanceWrapperProps {
  children: React.ReactNode;
}

const MaintenanceWrapper: React.FC<MaintenanceWrapperProps> = ({ children }) => {
  const { user, isSuperAdmin } = useAuth();
  const [maintenanceSettings, setMaintenanceSettings] = useState<db.MaintenanceSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkMaintenanceStatus();
    
    // Check maintenance status every 30 seconds
    const interval = setInterval(checkMaintenanceStatus, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const checkMaintenanceStatus = async () => {
    try {
      const settings = await db.getMaintenanceSettings();
      setMaintenanceSettings(settings);
      setError(null);
    } catch (err) {
      console.error('Failed to check maintenance status:', err);
      setError('Failed to check maintenance status');
      // If we can't check maintenance status, assume site is operational
      setMaintenanceSettings(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading while checking maintenance status
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  // If there's an error checking maintenance status, show the app (fail-safe)
  if (error) {
    console.warn('Maintenance check failed, showing app:', error);
    return <>{children}</>;
  }

  // If maintenance mode is enabled and user is not a super admin, show maintenance page
  if (maintenanceSettings?.isMaintenanceMode && !isSuperAdmin()) {
    return (
      <MaintenancePage
        maintenanceTitle={maintenanceSettings.maintenanceTitle}
        maintenanceMessage={maintenanceSettings.maintenanceMessage}
        estimatedCompletion={maintenanceSettings.estimatedCompletion}
      />
    );
  }

  // Show normal app
  return <>{children}</>;
};

export default MaintenanceWrapper;
