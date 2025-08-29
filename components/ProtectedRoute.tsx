/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import * as db from '../services/db';
import MaintenancePage from './MaintenancePage';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireSuperAdmin?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requireSuperAdmin = false }) => {
  const { isAuthenticated, user } = useAuth();
  const [siteAccessEnabled, setSiteAccessEnabled] = useState<boolean | null>(null);
  const [isLoadingSiteAccess, setIsLoadingSiteAccess] = useState(true);

  useEffect(() => {
    const checkSiteAccess = async () => {
      try {
        const accessEnabled = await db.isSiteAccessEnabled();
        setSiteAccessEnabled(accessEnabled);
      } catch (error) {
        console.error('Error checking site access:', error);
        setSiteAccessEnabled(true); // Default to enabled on error
      } finally {
        setIsLoadingSiteAccess(false);
      }
    };

    checkSiteAccess();
  }, []);

  // Show loading while checking site access
  if (isLoadingSiteAccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  // Check site access for non-super admin users
  if (!siteAccessEnabled && user?.role !== 'superadmin') {
    return <MaintenancePage />;
  }

  if (requireSuperAdmin && user?.role !== 'superadmin') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-indigo-900 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-8 max-w-md">
            <h1 className="text-2xl font-bold text-red-400 mb-4">Access Denied</h1>
            <p className="text-gray-300 mb-6">
              You don't have permission to access this page. Super admin privileges are required.
            </p>
            <button
              onClick={() => window.history.back()}
              className="bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg transition"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;
