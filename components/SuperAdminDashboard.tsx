/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { User, UserAnalytics, AIModelConfig } from '../types';
import * as db from '../services/db';

const SuperAdminDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'analytics' | 'users' | 'models' | 'settings'>('analytics');
  const [analytics, setAnalytics] = useState<UserAnalytics | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [models, setModels] = useState<AIModelConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [siteAccessEnabled, setSiteAccessEnabled] = useState(true);
  const [newModel, setNewModel] = useState({
    name: '',
    modelId: '',
    apiKey: '',
    isActive: true
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [analyticsData, usersData, modelsData, siteAccess] = await Promise.all([
        db.getUserAnalytics(),
        db.getAllUsers(),
        db.getAllAIModels(),
        db.isSiteAccessEnabled()
      ]);
      
      setAnalytics(analyticsData);
      setUsers(usersData);
      setModels(modelsData);
      setSiteAccessEnabled(siteAccess);
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

  const handleToggleSiteAccess = async () => {
    try {
      const newState = !siteAccessEnabled;
      await db.setSiteAccess(newState);
      setSiteAccessEnabled(newState);
      
      if (newState) {
        alert('Site access has been ENABLED. All users can now access the site.');
      } else {
        alert('Site access has been DISABLED. Only super admins can access the site.');
      }
    } catch (error) {
      console.error('Error toggling site access:', error);
      alert('Failed to update site access setting');
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
        <div className="flex space-x-1 mb-6">
          {[
            { id: 'analytics', label: 'Analytics' },
            { id: 'users', label: 'Users' },
            { id: 'models', label: 'AI Models' },
            { id: 'settings', label: 'Settings' }
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
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          user.role === 'superadmin' 
                            ? 'bg-purple-100 text-purple-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {user.role}
                        </span>
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

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="space-y-6">
            {/* Site Access Control */}
            <div className="bg-black/20 backdrop-blur-sm border border-gray-700/50 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">Site Access Control</h3>
                  <p className="text-gray-400 mb-4">
                    Control whether regular users can access the site. When disabled, only super admins can access the application.
                  </p>
                  <div className="flex items-center gap-3">
                    <span className={`text-sm font-medium ${siteAccessEnabled ? 'text-green-400' : 'text-red-400'}`}>
                      Status: {siteAccessEnabled ? 'ENABLED - Users can access the site' : 'DISABLED - Site restricted to super admins only'}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col items-center gap-4">
                  <button
                    onClick={handleToggleSiteAccess}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 ${
                      siteAccessEnabled ? 'bg-green-600' : 'bg-red-600'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        siteAccessEnabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                  <span className="text-xs text-gray-400 text-center">
                    {siteAccessEnabled ? 'Click to disable' : 'Click to enable'}
                  </span>
                </div>
              </div>
              
              {!siteAccessEnabled && (
                <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <span className="text-red-300 font-medium">Warning: Site Access Disabled</span>
                  </div>
                  <p className="text-red-200 text-sm mt-2">
                    Regular users will see a maintenance page and cannot access the application. 
                    Only super admin accounts can bypass this restriction.
                  </p>
                </div>
              )}
            </div>

            {/* Additional Settings Placeholder */}
            <div className="bg-black/20 backdrop-blur-sm border border-gray-700/50 rounded-lg p-6">
              <h3 className="text-xl font-semibold text-white mb-2">Additional Settings</h3>
              <p className="text-gray-400">More administrative settings will be available here in future updates.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SuperAdminDashboard;
