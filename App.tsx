/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import AuthPage from './components/AuthPage';
import MainApp from './components/MainApp';
import SuperAdminDashboard from './components/SuperAdminDashboard';
import ProtectedRoute from './components/ProtectedRoute';
import MaintenancePage from './components/MaintenancePage';
import * as db from './services/db';

const AppRoutes: React.FC = () => {
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
  }, [user]); // Re-check when user changes

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

  // If site access is disabled and user is not a super admin, show maintenance page
  if (!siteAccessEnabled && (!user || user.role !== 'superadmin')) {
    return <MaintenancePage />;
  }

  return (
    <Routes>
      <Route 
        path="/auth" 
        element={isAuthenticated ? <Navigate to="/" replace /> : <AuthPage />} 
      />
      <Route 
        path="/" 
        element={
          <ProtectedRoute>
            <MainApp />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/superadmin" 
        element={
          <ProtectedRoute requireSuperAdmin>
            <SuperAdminDashboard />
          </ProtectedRoute>
        } 
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <AuthProvider>
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-indigo-900">
          <AppRoutes />
        </div>
      </AuthProvider>
    </Router>
  );
};

export default App;