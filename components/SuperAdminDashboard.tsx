/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { User, UserAnalytics, AIModelConfig } from '../types';
import * as db from '../services/supabaseDb';

const SuperAdminDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'analytics' | 'users' | 'models' | 'maintenance' | 'approvals'>('analytics');
  const [analytics, setAnalytics] = useState<UserAnalytics | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [pendingUsers, setPendingUsers] = useState<User[]>([]);
  const [models, setModels] = useState<AIModelConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newModel, setNewModel] = useState({
    name: '',
    modelId: '',
    apiKey: '',
    isActive: true
  });
  const [maintenanceSettings, setMaintenanceSettings] = useState<db.MaintenanceSettings | null>(null);
  const [maintenanceForm, setMaintenanceForm] = useState({
    isMaintenanceMode: false,
    maintenanceTitle: 'Site Under Maintenance',
    maintenanceMessage: 'We are currently performing scheduled maintenance. Please check back soon.',
    estimatedCompletion: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [analyticsData, usersData, modelsData, maintenanceData, pendingUsersData] = await Promise.all([
        db.getUserAnalytics(),
        db.getAllUsers(),
        db.getAllAIModels(),
        db.getMaintenanceSettings(),
        db.getPendingUsers()
      ]);
      
      setAnalytics(analyticsData);
      setUsers(usersData);
      setPendingUsers(pendingUsersData);
      setModels(modelsData);
      setMaintenanceSettings(maintenanceData);
      
      // Update maintenance form with current settings
      if (maintenanceData) {
        setMaintenanceForm({
          isMaintenanceMode: maintenanceData.isMaintenanceMode,
          maintenanceTitle: maintenanceData.maintenanceTitle,
          maintenanceMessage: maintenanceData.maintenanceMessage,
          estimatedCompletion: maintenanceData.estimatedCompletion 
            ? maintenanceData.estimatedCompletion.toISOString().slice(0, 16) 
            : ''
        });
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteUser = async (userId: number) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await db.deleteUser(userId);
        setUsers(users.filter(u => u.id !== userId));
      } catch (error) {
        console.error('Error deleting user:', error);
        alert('Failed to delete user');
      }
    }
  };

  const handleAddModel = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const modelId = await db.addAIModel({
        ...newModel,
        createdAt: Date.now()
      });
      
      const addedModel = { ...newModel, id: modelId, createdAt: Date.now() };
      setModels([...models, addedModel]);
      setNewModel({ name: '', modelId: '', apiKey: '', isActive: true });
    } catch (error) {
      console.error('Error adding model:', error);
      alert('Failed to add model');
    }
  };

  const handleToggleModel = async (model: AIModelConfig) => {
    try {
      const updatedModel = { ...model, isActive: !model.isActive };
      await db.updateAIModel(updatedModel);
      setModels(models.map(m => m.id === model.id ? updatedModel : m));
    } catch (error) {
      console.error('Error updating model:', error);
      alert('Failed to update model');
    }
  };

  const handleDeleteModel = async (modelId: number) => {
    if (window.confirm('Are you sure you want to delete this model?')) {
      try {
        await db.deleteAIModel(modelId);
        setModels(models.filter(m => m.id !== modelId));
      } catch (error) {
        console.error('Error deleting model:', error);
        alert('Failed to delete model');
      }
    }
  };

  const handleApproveUser = async (userId: number) => {
    if (!user) return;
    
    try {
      await db.approveUser(userId, user.id);
      // Refresh data
      const [usersData, pendingUsersData] = await Promise.all([
        db.getAllUsers(),
        db.getPendingUsers()
      ]);
      setUsers(usersData);
      setPendingUsers(pendingUsersData);
      alert('User approved successfully!');
    } catch (error) {
      console.error('Error approving user:', error);
      alert('Failed to approve user');
    }
  };

  const handleRejectUser = async (userId: number) => {
    if (!user) return;
    
    if (window.confirm('Are you sure you want to reject this user? This action cannot be undone.')) {
      try {
        await db.rejectUser(userId, user.id);
        // Refresh data
        const [usersData, pendingUsersData] = await Promise.all([
          db.getAllUsers(),
          db.getPendingUsers()
        ]);
        setUsers(usersData);
        setPendingUsers(pendingUsersData);
        alert('User rejected successfully!');
      } catch (error) {
        console.error('Error rejecting user:', error);
        alert('Failed to reject user');
      }
    }
  };

  const handleMaintenanceUpdate = async () => {
    try {
      const estimatedCompletion = maintenanceForm.estimatedCompletion 
        ? new Date(maintenanceForm.estimatedCompletion)
        : undefined;

      await db.updateMaintenanceSettings(
        maintenanceForm.isMaintenanceMode,
        maintenanceForm.maintenanceMessage,
        maintenanceForm.maintenanceTitle,
        estimatedCompletion,
        user?.id
      );

      // Reload maintenance settings
      const updatedSettings = await db.getMaintenanceSettings();
      setMaintenanceSettings(updatedSettings);
      
      alert(`Maintenance mode ${maintenanceForm.isMaintenanceMode ? 'enabled' : 'disabled'} successfully!`);
      
      // If maintenance mode is enabled, we could optionally redirect or show a warning
      if (maintenanceForm.isMaintenanceMode) {
        alert('⚠️ Maintenance mode is now ACTIVE. Regular users will see the maintenance page.');
      }
    } catch (error) {
      console.error('Failed to update maintenance settings:', error);
      alert('Failed to update maintenance settings. Please try again.');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-indigo-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Super Admin Dashboard</h1>
            <p className="text-gray-400 mt-1">Welcome back, {user?.firstName}</p>
          </div>
          <div className="flex gap-4">
            <button
              onClick={() => window.location.href = '/'}
              className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition"
            >
              Back to App
            </button>
            <button
              onClick={logout}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 mb-6 flex-wrap">
          {[
            { id: 'analytics', label: 'Analytics' },
            { id: 'users', label: 'Users' },
            { id: 'approvals', label: `Approvals${pendingUsers.length > 0 ? ` (${pendingUsers.length})` : ''}` },
            { id: 'models', label: 'AI Models' },
            { id: 'maintenance', label: 'Maintenance' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-6 py-3 rounded-lg font-medium transition ${
                activeTab === tab.id
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Analytics Tab */}
        {activeTab === 'analytics' && analytics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-black/20 backdrop-blur-sm border border-gray-700/50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-2">Total Users</h3>
              <p className="text-3xl font-bold text-purple-400">{analytics.totalUsers}</p>
            </div>
            <div className="bg-black/20 backdrop-blur-sm border border-gray-700/50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-2">Active Users</h3>
              <p className="text-3xl font-bold text-green-400">{analytics.activeUsers}</p>
              <p className="text-sm text-gray-400">Last 7 days</p>
            </div>
            <div className="bg-black/20 backdrop-blur-sm border border-gray-700/50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-2">Total Videos</h3>
              <p className="text-3xl font-bold text-blue-400">{analytics.totalVideos}</p>
            </div>
            <div className="bg-black/20 backdrop-blur-sm border border-gray-700/50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-2">Videos Today</h3>
              <p className="text-3xl font-bold text-yellow-400">{analytics.videosToday}</p>
            </div>
            <div className="bg-black/20 backdrop-blur-sm border border-gray-700/50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-2">Videos This Week</h3>
              <p className="text-3xl font-bold text-indigo-400">{analytics.videosThisWeek}</p>
            </div>
            <div className="bg-black/20 backdrop-blur-sm border border-gray-700/50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-2">Videos This Month</h3>
              <p className="text-3xl font-bold text-pink-400">{analytics.videosThisMonth}</p>
            </div>
          </div>
        )}

        {/* Approvals Tab */}
        {activeTab === 'approvals' && (
          <div className="bg-black/20 backdrop-blur-sm border border-gray-700/50 rounded-lg overflow-hidden">
            <div className="p-6 border-b border-gray-700/50">
              <h3 className="text-xl font-semibold text-white">User Approvals</h3>
              <p className="text-gray-400 text-sm mt-1">
                Review and approve new user registrations
              </p>
            </div>
            {pendingUsers.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-800/50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">User</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Registered</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700/50">
                    {pendingUsers.map((pendingUser) => (
                      <tr key={pendingUser.id} className="hover:bg-gray-800/25">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-white">
                            {pendingUser.firstName} {pendingUser.lastName}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                          {pendingUser.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                          {new Date(pendingUser.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                            Pending
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                          <button
                            onClick={() => handleApproveUser(pendingUser.id)}
                            className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm font-medium transition"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleRejectUser(pendingUser.id)}
                            className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm font-medium transition"
                          >
                            Reject
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-8 text-center">
                <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h4 className="text-lg font-medium text-white mb-2">No Pending Approvals</h4>
                <p className="text-gray-400">All users have been reviewed. New registrations will appear here.</p>
              </div>
            )}
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="bg-black/20 backdrop-blur-sm border border-gray-700/50 rounded-lg overflow-hidden">
            <div className="p-6 border-b border-gray-700/50">
              <h3 className="text-xl font-semibold text-white">User Management</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-800/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">User</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Role</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Created</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Last Login</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700/50">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-800/25">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-white">
                          {user.firstName} {user.lastName}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {user.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="space-y-1">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            user.role === 'superadmin' 
                              ? 'bg-purple-100 text-purple-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {user.role}
                          </span>
                          <div>
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              user.approvalStatus === 'approved' 
                                ? 'bg-green-100 text-green-800'
                                : user.approvalStatus === 'rejected'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {user.approvalStatus}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {user.role !== 'superadmin' && (
                          <button
                            onClick={() => handleDeleteUser(user.id)}
                            className="text-red-400 hover:text-red-300 font-medium"
                          >
                            Delete
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Models Tab */}
        {activeTab === 'models' && (
          <div className="space-y-6">
            {/* Add New Model Form */}
            <div className="bg-black/20 backdrop-blur-sm border border-gray-700/50 rounded-lg p-6">
              <h3 className="text-xl font-semibold text-white mb-4">Add New AI Model</h3>
              <form onSubmit={handleAddModel} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <input
                  type="text"
                  placeholder="Model Name"
                  value={newModel.name}
                  onChange={(e) => setNewModel({ ...newModel, name: e.target.value })}
                  className="bg-gray-800/50 border border-gray-600 text-gray-200 rounded-lg p-3 focus:ring-2 focus:ring-purple-500"
                  required
                />
                <input
                  type="text"
                  placeholder="Model ID"
                  value={newModel.modelId}
                  onChange={(e) => setNewModel({ ...newModel, modelId: e.target.value })}
                  className="bg-gray-800/50 border border-gray-600 text-gray-200 rounded-lg p-3 focus:ring-2 focus:ring-purple-500"
                  required
                />
                <input
                  type="password"
                  placeholder="API Key"
                  value={newModel.apiKey}
                  onChange={(e) => setNewModel({ ...newModel, apiKey: e.target.value })}
                  className="bg-gray-800/50 border border-gray-600 text-gray-200 rounded-lg p-3 focus:ring-2 focus:ring-purple-500"
                  required
                />
                <button
                  type="submit"
                  className="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-lg transition"
                >
                  Add Model
                </button>
              </form>
            </div>

            {/* Models List */}
            <div className="bg-black/20 backdrop-blur-sm border border-gray-700/50 rounded-lg overflow-hidden">
              <div className="p-6 border-b border-gray-700/50">
                <h3 className="text-xl font-semibold text-white">AI Models</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-800/50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Model ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Created</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700/50">
                    {models.map((model) => (
                      <tr key={model.id} className="hover:bg-gray-800/25">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                          {model.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                          {model.modelId}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            model.isActive 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {model.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                          {new Date(model.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                          <button
                            onClick={() => handleToggleModel(model)}
                            className="text-blue-400 hover:text-blue-300 font-medium"
                          >
                            {model.isActive ? 'Deactivate' : 'Activate'}
                          </button>
                          <button
                            onClick={() => handleDeleteModel(model.id)}
                            className="text-red-400 hover:text-red-300 font-medium"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Maintenance Tab */}
        {activeTab === 'maintenance' && (
          <div className="space-y-6">
            {/* Current Status */}
            <div className="bg-black/20 backdrop-blur-sm border border-gray-700/50 rounded-lg p-6">
              <h3 className="text-xl font-semibold text-white mb-4">Current Maintenance Status</h3>
              <div className="flex items-center gap-4 mb-4">
                <div className={`w-4 h-4 rounded-full ${
                  maintenanceSettings?.isMaintenanceMode 
                    ? 'bg-red-500 animate-pulse' 
                    : 'bg-green-500'
                }`}></div>
                <span className="text-white font-medium">
                  {maintenanceSettings?.isMaintenanceMode ? 'MAINTENANCE MODE ACTIVE' : 'Site is operational'}
                </span>
              </div>
              
              {maintenanceSettings?.isMaintenanceMode && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-4">
                  <p className="text-red-300 mb-2">
                    ⚠️ <strong>Warning:</strong> Maintenance mode is currently active. 
                    Regular users cannot access the site.
                  </p>
                  {maintenanceSettings.enabledAt && (
                    <p className="text-red-300 text-sm">
                      Enabled: {maintenanceSettings.enabledAt.toLocaleString()}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Maintenance Controls */}
            <div className="bg-black/20 backdrop-blur-sm border border-gray-700/50 rounded-lg p-6">
              <h3 className="text-xl font-semibold text-white mb-4">Maintenance Controls</h3>
              
              <div className="space-y-4">
                {/* Enable/Disable Toggle */}
                <div>
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={maintenanceForm.isMaintenanceMode}
                      onChange={(e) => setMaintenanceForm({
                        ...maintenanceForm,
                        isMaintenanceMode: e.target.checked
                      })}
                      className="w-5 h-5 text-red-600 bg-gray-700 border-gray-600 rounded focus:ring-red-500 focus:ring-2"
                    />
                    <span className="text-white font-medium">Enable Maintenance Mode</span>
                  </label>
                  <p className="text-gray-400 text-sm mt-1">
                    When enabled, only super admins can access the site
                  </p>
                </div>

                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Maintenance Page Title
                  </label>
                  <input
                    type="text"
                    value={maintenanceForm.maintenanceTitle}
                    onChange={(e) => setMaintenanceForm({
                      ...maintenanceForm,
                      maintenanceTitle: e.target.value
                    })}
                    className="w-full p-3 bg-gray-800/50 border border-gray-600 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                    placeholder="Site Under Maintenance"
                  />
                </div>

                {/* Message */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Maintenance Message
                  </label>
                  <textarea
                    value={maintenanceForm.maintenanceMessage}
                    onChange={(e) => setMaintenanceForm({
                      ...maintenanceForm,
                      maintenanceMessage: e.target.value
                    })}
                    rows={4}
                    className="w-full p-3 bg-gray-800/50 border border-gray-600 rounded-lg text-white focus:border-blue-500 focus:outline-none resize-none"
                    placeholder="We are currently performing scheduled maintenance. Please check back soon."
                  />
                </div>

                {/* Estimated Completion */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Estimated Completion (Optional)
                  </label>
                  <input
                    type="datetime-local"
                    value={maintenanceForm.estimatedCompletion}
                    onChange={(e) => setMaintenanceForm({
                      ...maintenanceForm,
                      estimatedCompletion: e.target.value
                    })}
                    className="w-full p-3 bg-gray-800/50 border border-gray-600 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                  />
                  <p className="text-gray-400 text-sm mt-1">
                    Leave empty if completion time is unknown
                  </p>
                </div>

                {/* Update Button */}
                <div className="pt-4">
                  <button
                    onClick={handleMaintenanceUpdate}
                    className={`w-full py-3 px-6 rounded-lg font-medium transition ${
                      maintenanceForm.isMaintenanceMode
                        ? 'bg-red-600 hover:bg-red-700 text-white'
                        : 'bg-green-600 hover:bg-green-700 text-white'
                    }`}
                  >
                    {maintenanceForm.isMaintenanceMode ? '🔒 Enable Maintenance Mode' : '✅ Disable Maintenance Mode'}
                  </button>
                </div>
              </div>
            </div>

            {/* Preview */}
            {maintenanceForm.isMaintenanceMode && (
              <div className="bg-black/20 backdrop-blur-sm border border-gray-700/50 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-white mb-4">Preview</h3>
                <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-600">
                  <h4 className="text-2xl font-bold text-white mb-2">
                    {maintenanceForm.maintenanceTitle}
                  </h4>
                  <p className="text-gray-300 mb-4">
                    {maintenanceForm.maintenanceMessage}
                  </p>
                  {maintenanceForm.estimatedCompletion && (
                    <p className="text-blue-300 text-sm">
                      Estimated completion: {new Date(maintenanceForm.estimatedCompletion).toLocaleString()}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SuperAdminDashboard;
