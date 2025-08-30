/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { supabase } from './supabase'
import { VideoCreation, User, AIModelConfig, UserAnalytics } from '../types'
import CryptoJS from 'crypto-js'

// Use the same JWT_SECRET as authService for consistent password hashing
const JWT_SECRET = 'InDus123^&Meta!!Solutions'

// User Management
export async function createUser(email: string, password: string, role: 'user' | 'super_admin' = 'user', firstName?: string, lastName?: string): Promise<User> {
  const passwordHash = CryptoJS.SHA256(password + JWT_SECRET).toString()
  
  // Super admins are automatically approved, regular users need approval
  const approvalStatus = role === 'super_admin' ? 'approved' : 'pending'
  const approvedAt = role === 'super_admin' ? new Date().toISOString() : null
  
  const { data, error } = await supabase
    .from('users')
    .insert({
      email,
      password_hash: passwordHash,
      first_name: firstName,
      last_name: lastName,
      role,
      approval_status: approvalStatus,
      approved_at: approvedAt,
      created_at: new Date().toISOString()
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to create user: ${error.message}`)
  }

  return {
    id: data.id,
    email: data.email,
    passwordHash: data.password_hash,
    firstName: data.first_name || '',
    lastName: data.last_name || '',
    role: data.role,
    createdAt: new Date(data.created_at).getTime(),
    lastLogin: data.last_login ? new Date(data.last_login).getTime() : undefined,
    approvalStatus: data.approval_status || 'pending',
    approvedBy: data.approved_by,
    approvedAt: data.approved_at ? new Date(data.approved_at).getTime() : undefined
  }
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null // No rows returned
    throw new Error(`Failed to get user: ${error.message}`)
  }

  return {
    id: data.id,
    email: data.email,
    passwordHash: data.password_hash,
    firstName: data.first_name || '',
    lastName: data.last_name || '',
    role: data.role,
    createdAt: new Date(data.created_at).getTime(),
    lastLogin: data.last_login ? new Date(data.last_login).getTime() : undefined,
    approvalStatus: data.approval_status || 'pending',
    approvedBy: data.approved_by,
    approvedAt: data.approved_at ? new Date(data.approved_at).getTime() : undefined
  }
}

export async function getUserById(id: number): Promise<User | null> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null // No rows returned
    throw new Error(`Failed to get user: ${error.message}`)
  }

  return {
    id: data.id,
    email: data.email,
    passwordHash: data.password_hash,
    firstName: data.first_name || '',
    lastName: data.last_name || '',
    role: data.role,
    createdAt: new Date(data.created_at).getTime(),
    lastLogin: data.last_login ? new Date(data.last_login).getTime() : undefined,
    approvalStatus: data.approval_status || 'pending',
    approvedBy: data.approved_by,
    approvedAt: data.approved_at ? new Date(data.approved_at).getTime() : undefined
  }
}

export async function validateUser(email: string, password: string): Promise<User | null> {
  const user = await getUserByEmail(email)
  if (!user) return null

  // Check if user is approved
  if (user.approvalStatus !== 'approved') {
    throw new Error(`Account pending approval. Please wait for admin approval before logging in.`)
  }

  const { data, error } = await supabase
    .from('users')
    .select('password_hash')
    .eq('email', email)
    .single()

  if (error) return null

  const passwordHash = CryptoJS.SHA256(password + JWT_SECRET).toString()
  if (data.password_hash !== passwordHash) return null

  // Update last login
  await supabase
    .from('users')
    .update({ last_login: new Date().toISOString() })
    .eq('email', email)

  return user
}

export async function getAllUsers(): Promise<User[]> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(`Failed to get users: ${error.message}`)
  }

  return data.map(user => ({
    id: user.id,
    email: user.email,
    passwordHash: user.password_hash,
    firstName: user.first_name || '',
    lastName: user.last_name || '',
    role: user.role,
    createdAt: new Date(user.created_at).getTime(),
    lastLogin: user.last_login ? new Date(user.last_login).getTime() : undefined,
    approvalStatus: user.approval_status || 'pending',
    approvedBy: user.approved_by,
    approvedAt: user.approved_at ? new Date(user.approved_at).getTime() : undefined
  }))
}

export async function deleteUser(id: number): Promise<void> {
  // First delete all videos by this user
  await supabase
    .from('videos')
    .delete()
    .eq('user_id', id)

  // Then delete the user
  const { error } = await supabase
    .from('users')
    .delete()
    .eq('id', id)

  if (error) {
    throw new Error(`Failed to delete user: ${error.message}`)
  }
}

// User Approval Functions
export async function approveUser(userId: number, approvedBy: number): Promise<void> {
  const { error } = await supabase
    .from('users')
    .update({
      approval_status: 'approved',
      approved_by: approvedBy,
      approved_at: new Date().toISOString()
    })
    .eq('id', userId)

  if (error) {
    throw new Error(`Failed to approve user: ${error.message}`)
  }
}

export async function rejectUser(userId: number, approvedBy: number): Promise<void> {
  const { error } = await supabase
    .from('users')
    .update({
      approval_status: 'rejected',
      approved_by: approvedBy,
      approved_at: new Date().toISOString()
    })
    .eq('id', userId)

  if (error) {
    throw new Error(`Failed to reject user: ${error.message}`)
  }
}

export async function getPendingUsers(): Promise<User[]> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('approval_status', 'pending')
    .order('created_at', { ascending: true })

  if (error) {
    throw new Error(`Failed to get pending users: ${error.message}`)
  }

  return data.map(user => ({
    id: user.id,
    email: user.email,
    passwordHash: user.password_hash,
    firstName: user.first_name || '',
    lastName: user.last_name || '',
    role: user.role,
    createdAt: new Date(user.created_at).getTime(),
    lastLogin: user.last_login ? new Date(user.last_login).getTime() : undefined,
    approvalStatus: user.approval_status || 'pending',
    approvedBy: user.approved_by,
    approvedAt: user.approved_at ? new Date(user.approved_at).getTime() : undefined
  }))
}

export async function getUserAnalytics(): Promise<UserAnalytics> {
  // Get total users
  const { count: totalUsers, error: usersError } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true })

  if (usersError) {
    throw new Error(`Failed to get user count: ${usersError.message}`)
  }

  // Get total videos
  const { count: totalVideos, error: videosError } = await supabase
    .from('videos')
    .select('*', { count: 'exact', head: true })

  if (videosError) {
    throw new Error(`Failed to get video count: ${videosError.message}`)
  }

  // Get users who logged in within the last 7 days (active users)
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  const { count: activeUsers, error: activeUsersError } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true })
    .gte('last_login', sevenDaysAgo.toISOString())

  if (activeUsersError) {
    throw new Error(`Failed to get active users count: ${activeUsersError.message}`)
  }

  // Get videos created today
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const { count: videosToday, error: videosTodayError } = await supabase
    .from('videos')
    .select('*', { count: 'exact', head: true })
    .gte('timestamp', today.toISOString())

  if (videosTodayError) {
    throw new Error(`Failed to get today's videos count: ${videosTodayError.message}`)
  }

  // Get videos created in the last 7 days
  const { count: videosThisWeek, error: videosWeekError } = await supabase
    .from('videos')
    .select('*', { count: 'exact', head: true })
    .gte('timestamp', sevenDaysAgo.toISOString())

  if (videosWeekError) {
    throw new Error(`Failed to get this week's videos count: ${videosWeekError.message}`)
  }

  // Get videos created in the last 30 days
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const { count: videosThisMonth, error: videosMonthError } = await supabase
    .from('videos')
    .select('*', { count: 'exact', head: true })
    .gte('timestamp', thirtyDaysAgo.toISOString())

  if (videosMonthError) {
    throw new Error(`Failed to get this month's videos count: ${videosMonthError.message}`)
  }

  return {
    totalUsers: totalUsers || 0,
    activeUsers: activeUsers || 0,
    totalVideos: totalVideos || 0,
    videosToday: videosToday || 0,
    videosThisWeek: videosThisWeek || 0,
    videosThisMonth: videosThisMonth || 0
  }
}

// Video Management
export async function saveVideo(video: Omit<VideoCreation, 'id'>): Promise<VideoCreation> {
  const { data, error } = await supabase
    .from('videos')
    .insert({
      user_id: video.userId,
      url: video.url,
      prompt: video.prompt,
      animation_style: video.animationStyle,
      timestamp: video.timestamp,
      drive_file_id: video.driveFileId,
      drive_view_link: video.driveViewLink,
      drive_download_link: video.driveDownloadLink,
      is_stored_in_drive: video.isStoredInDrive
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to save video: ${error.message}`)
  }

  return {
    id: data.id,
    userId: data.user_id,
    url: data.url,
    prompt: data.prompt,
    animationStyle: data.animation_style,
    timestamp: data.timestamp,
    driveFileId: data.drive_file_id,
    driveViewLink: data.drive_view_link,
    driveDownloadLink: data.drive_download_link,
    isStoredInDrive: data.is_stored_in_drive
  }
}

export async function addVideo(video: Omit<VideoCreation, 'id' | 'url'>): Promise<number> {
  const { data, error } = await supabase
    .from('videos')
    .insert({
      user_id: video.userId,
      url: '', // Will be set to blob URL on client side
      prompt: video.prompt,
      animation_style: video.animationStyle || 'Default', // Provide default value
      timestamp: new Date(video.timestamp).toISOString(),
      drive_file_id: video.driveFileId,
      drive_view_link: video.driveViewLink,
      drive_download_link: video.driveDownloadLink,
      is_stored_in_drive: video.isStoredInDrive
    })
    .select('id')
    .single()

  if (error) {
    throw new Error(`Failed to add video: ${error.message}`)
  }

  return data.id
}

export async function getAllVideos(): Promise<VideoCreation[]> {
  const { data, error } = await supabase
    .from('videos')
    .select('*')
    .order('timestamp', { ascending: false })

  if (error) {
    throw new Error(`Failed to get videos: ${error.message}`)
  }

  return data.map(video => ({
    id: video.id,
    userId: video.user_id,
    url: video.url || '', // Provide default empty string
    prompt: video.prompt,
    animationStyle: video.animation_style,
    timestamp: video.timestamp,
    driveFileId: video.drive_file_id,
    driveViewLink: video.drive_view_link,
    driveDownloadLink: video.drive_download_link,
    isStoredInDrive: video.is_stored_in_drive
  }))
}

export async function getVideosByUserId(userId: number): Promise<VideoCreation[]> {
  const { data, error } = await supabase
    .from('videos')
    .select('*')
    .eq('user_id', userId)
    .order('timestamp', { ascending: false })

  if (error) {
    throw new Error(`Failed to get user videos: ${error.message}`)
  }

  return data.map(video => ({
    id: video.id,
    userId: video.user_id,
    url: video.url || '', // Provide default empty string
    prompt: video.prompt,
    animationStyle: video.animation_style,
    timestamp: video.timestamp,
    driveFileId: video.drive_file_id,
    driveViewLink: video.drive_view_link,
    driveDownloadLink: video.drive_download_link,
    isStoredInDrive: video.is_stored_in_drive
  }))
}

export async function deleteVideo(id: number): Promise<void> {
  const { error } = await supabase
    .from('videos')
    .delete()
    .eq('id', id)

  if (error) {
    throw new Error(`Failed to delete video: ${error.message}`)
  }
}

// AI Model Management
export async function saveAIModel(model: Omit<AIModelConfig, 'id' | 'createdAt'>): Promise<AIModelConfig> {
  const { data, error } = await supabase
    .from('ai_models')
    .insert({
      name: model.name,
      model_id: model.modelId,
      api_key: model.apiKey,
      is_active: model.isActive,
      created_at: new Date().toISOString()
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to save AI model: ${error.message}`)
  }

  return {
    id: data.id,
    name: data.name,
    modelId: data.model_id,
    apiKey: data.api_key,
    isActive: data.is_active,
    createdAt: data.created_at
  }
}

export async function addAIModel(model: Omit<AIModelConfig, 'id'>): Promise<number> {
  const { data, error } = await supabase
    .from('ai_models')
    .insert({
      name: model.name,
      model_id: model.modelId,
      api_key: model.apiKey,
      is_active: model.isActive,
      created_at: new Date().toISOString()
    })
    .select('id')
    .single()

  if (error) {
    throw new Error(`Failed to add AI model: ${error.message}`)
  }

  return data.id
}

export async function getAllAIModels(): Promise<AIModelConfig[]> {
  const { data, error } = await supabase
    .from('ai_models')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(`Failed to get AI models: ${error.message}`)
  }

  return data.map(model => ({
    id: model.id,
    name: model.name,
    modelId: model.model_id,
    apiKey: model.api_key,
    isActive: model.is_active,
    createdAt: model.created_at
  }))
}

export async function updateAIModel(model: AIModelConfig): Promise<void> {
  const { error } = await supabase
    .from('ai_models')
    .update({
      name: model.name,
      model_id: model.modelId,
      api_key: model.apiKey,
      is_active: model.isActive
    })
    .eq('id', model.id)

  if (error) {
    throw new Error(`Failed to update AI model: ${error.message}`)
  }
}

export async function deleteAIModel(id: number): Promise<void> {
  const { error } = await supabase
    .from('ai_models')
    .delete()
    .eq('id', id)

  if (error) {
    throw new Error(`Failed to delete AI model: ${error.message}`)
  }
}

// Password Reset Functions
export async function createPasswordResetToken(email: string): Promise<string | null> {
  const user = await getUserByEmail(email)
  if (!user) return null

  // Generate a random token
  const token = CryptoJS.lib.WordArray.random(32).toString()
  const expiresAt = new Date()
  expiresAt.setHours(expiresAt.getHours() + 1) // Token expires in 1 hour

  const { error } = await supabase
    .from('password_reset_tokens')
    .insert({
      user_id: user.id,
      token,
      expires_at: expiresAt.toISOString()
    })

  if (error) {
    throw new Error(`Failed to create password reset token: ${error.message}`)
  }

  return token
}

export async function resetPassword(token: string, newPassword: string): Promise<boolean> {
  // Find valid token
  const { data: tokenData, error: tokenError } = await supabase
    .from('password_reset_tokens')
    .select('*, users(email)')
    .eq('token', token)
    .eq('used', false)
    .gt('expires_at', new Date().toISOString())
    .single()

  if (tokenError || !tokenData) return false

  // Update password
  const passwordHash = CryptoJS.SHA256(newPassword).toString()
  const { error: updateError } = await supabase
    .from('users')
    .update({ password_hash: passwordHash })
    .eq('id', tokenData.user_id)

  if (updateError) return false

  // Mark token as used
  await supabase
    .from('password_reset_tokens')
    .update({ used: true })
    .eq('id', tokenData.id)

  return true
}

// User Settings Management (Google Drive, etc.)
export async function getUserSettings(userId: number): Promise<any> {
  const { data, error } = await supabase
    .from('user_settings')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      // No settings exist, create default
      return await createUserSettings(userId)
    }
    throw new Error(`Failed to get user settings: ${error.message}`)
  }

  return {
    userId: data.user_id,
    googleDriveConnected: data.google_drive_connected,
    googleDriveToken: data.google_drive_token,
    googleDriveRefreshToken: data.google_drive_refresh_token,
    googleDriveFolderId: data.google_drive_folder_id,
    createdAt: data.created_at,
    updatedAt: data.updated_at
  }
}

export async function createUserSettings(userId: number): Promise<any> {
  const { data, error } = await supabase
    .from('user_settings')
    .insert({
      user_id: userId,
      google_drive_connected: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to create user settings: ${error.message}`)
  }

  return {
    userId: data.user_id,
    googleDriveConnected: data.google_drive_connected,
    googleDriveToken: data.google_drive_token,
    googleDriveRefreshToken: data.google_drive_refresh_token,
    googleDriveFolderId: data.google_drive_folder_id,
    createdAt: data.created_at,
    updatedAt: data.updated_at
  }
}

export async function updateUserSettings(userId: number, settings: {
  googleDriveConnected?: boolean,
  googleDriveToken?: string,
  googleDriveRefreshToken?: string,
  googleDriveFolderId?: string
}): Promise<void> {
  const updateData: any = {
    updated_at: new Date().toISOString()
  }

  if (settings.googleDriveConnected !== undefined) updateData.google_drive_connected = settings.googleDriveConnected
  if (settings.googleDriveToken !== undefined) updateData.google_drive_token = settings.googleDriveToken
  if (settings.googleDriveRefreshToken !== undefined) updateData.google_drive_refresh_token = settings.googleDriveRefreshToken
  if (settings.googleDriveFolderId !== undefined) updateData.google_drive_folder_id = settings.googleDriveFolderId

  const { error } = await supabase
    .from('user_settings')
    .update(updateData)
    .eq('user_id', userId)

  if (error) {
    throw new Error(`Failed to update user settings: ${error.message}`)
  }
}

// Initialize default super admin if it doesn't exist
export async function initializeDefaultSuperAdmin(): Promise<void> {
  try {
    const existingAdmin = await getUserByEmail('admin@pixshop.com')
    if (!existingAdmin) {
      await createUser('admin@pixshop.com', 'admin123!', 'super_admin')
      console.log('Default super admin created successfully')
    }
  } catch (error) {
    console.error('Failed to initialize default super admin:', error)
  }
}

// Maintenance Settings Management
export interface MaintenanceSettings {
  id: number
  isMaintenanceMode: boolean
  maintenanceMessage: string
  maintenanceTitle: string
  estimatedCompletion?: Date
  enabledBy?: number
  enabledAt?: Date
  updatedAt: Date
}

export async function getMaintenanceSettings(): Promise<MaintenanceSettings | null> {
  const { data, error } = await supabase
    .from('maintenance_settings')
    .select('*')
    .limit(1)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null // No rows returned
    throw new Error(`Failed to get maintenance settings: ${error.message}`)
  }

  return {
    id: data.id,
    isMaintenanceMode: data.is_maintenance_mode,
    maintenanceMessage: data.maintenance_message,
    maintenanceTitle: data.maintenance_title,
    estimatedCompletion: data.estimated_completion ? new Date(data.estimated_completion) : undefined,
    enabledBy: data.enabled_by,
    enabledAt: data.enabled_at ? new Date(data.enabled_at) : undefined,
    updatedAt: new Date(data.updated_at)
  }
}

export async function updateMaintenanceSettings(
  isMaintenanceMode: boolean,
  maintenanceMessage?: string,
  maintenanceTitle?: string,
  estimatedCompletion?: Date,
  enabledBy?: number
): Promise<MaintenanceSettings> {
  // Get existing settings or create default
  let existingSettings = await getMaintenanceSettings()
  
  if (!existingSettings) {
    // Create initial settings if none exist
    const { data, error } = await supabase
      .from('maintenance_settings')
      .insert({
        is_maintenance_mode: isMaintenanceMode,
        maintenance_message: maintenanceMessage || 'We are currently performing scheduled maintenance. Please check back soon.',
        maintenance_title: maintenanceTitle || 'Site Under Maintenance',
        estimated_completion: estimatedCompletion,
        enabled_by: enabledBy,
        enabled_at: isMaintenanceMode ? new Date() : null,
        updated_at: new Date()
      })
      .select('*')
      .single()

    if (error) {
      throw new Error(`Failed to create maintenance settings: ${error.message}`)
    }

    return {
      id: data.id,
      isMaintenanceMode: data.is_maintenance_mode,
      maintenanceMessage: data.maintenance_message,
      maintenanceTitle: data.maintenance_title,
      estimatedCompletion: data.estimated_completion ? new Date(data.estimated_completion) : undefined,
      enabledBy: data.enabled_by,
      enabledAt: data.enabled_at ? new Date(data.enabled_at) : undefined,
      updatedAt: new Date(data.updated_at)
    }
  }

  // Update existing settings
  const { data, error } = await supabase
    .from('maintenance_settings')
    .update({
      is_maintenance_mode: isMaintenanceMode,
      maintenance_message: maintenanceMessage || existingSettings.maintenanceMessage,
      maintenance_title: maintenanceTitle || existingSettings.maintenanceTitle,
      estimated_completion: estimatedCompletion,
      enabled_by: enabledBy,
      enabled_at: isMaintenanceMode ? new Date() : null,
      updated_at: new Date()
    })
    .eq('id', existingSettings.id)
    .select('*')
    .single()

  if (error) {
    throw new Error(`Failed to update maintenance settings: ${error.message}`)
  }

  return {
    id: data.id,
    isMaintenanceMode: data.is_maintenance_mode,
    maintenanceMessage: data.maintenance_message,
    maintenanceTitle: data.maintenance_title,
    estimatedCompletion: data.estimated_completion ? new Date(data.estimated_completion) : undefined,
    enabledBy: data.enabled_by,
    enabledAt: data.enabled_at ? new Date(data.enabled_at) : undefined,
    updatedAt: new Date(data.updated_at)
  }
}
