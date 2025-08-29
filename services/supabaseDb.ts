/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { supabase } from './supabase'
import { VideoCreation, User, AIModelConfig, UserAnalytics } from '../types'
import CryptoJS from 'crypto-js'

// User Management
export async function createUser(email: string, password: string, role: 'user' | 'super_admin' = 'user', firstName?: string, lastName?: string): Promise<User> {
  const passwordHash = CryptoJS.SHA256(password).toString()
  
  const { data, error } = await supabase
    .from('users')
    .insert({
      email,
      password_hash: passwordHash,
      first_name: firstName,
      last_name: lastName,
      role,
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
    lastLogin: data.last_login ? new Date(data.last_login).getTime() : undefined
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
    lastLogin: data.last_login ? new Date(data.last_login).getTime() : undefined
  }
}

export async function validateUser(email: string, password: string): Promise<User | null> {
  const user = await getUserByEmail(email)
  if (!user) return null

  const { data, error } = await supabase
    .from('users')
    .select('password_hash')
    .eq('email', email)
    .single()

  if (error) return null

  const passwordHash = CryptoJS.SHA256(password).toString()
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
    role: user.role,
    createdAt: user.created_at,
    lastLogin: user.last_login
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

  // Get users created in last 30 days
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const { count: newUsers, error: newUsersError } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', thirtyDaysAgo.toISOString())

  if (newUsersError) {
    throw new Error(`Failed to get new users count: ${newUsersError.message}`)
  }

  // Get videos created in last 30 days
  const { count: newVideos, error: newVideosError } = await supabase
    .from('videos')
    .select('*', { count: 'exact', head: true })
    .gte('timestamp', thirtyDaysAgo.toISOString())

  if (newVideosError) {
    throw new Error(`Failed to get new videos count: ${newVideosError.message}`)
  }

  return {
    totalUsers: totalUsers || 0,
    totalVideos: totalVideos || 0,
    newUsersThisMonth: newUsers || 0,
    newVideosThisMonth: newVideos || 0
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
    url: video.url,
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
    url: video.url,
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

export async function updateAIModel(id: number, updates: Partial<Omit<AIModelConfig, 'id' | 'createdAt'>>): Promise<void> {
  const updateData: any = {}
  
  if (updates.name !== undefined) updateData.name = updates.name
  if (updates.modelId !== undefined) updateData.model_id = updates.modelId
  if (updates.apiKey !== undefined) updateData.api_key = updates.apiKey
  if (updates.isActive !== undefined) updateData.is_active = updates.isActive

  const { error } = await supabase
    .from('ai_models')
    .update(updateData)
    .eq('id', id)

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
