/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: number
          email: string
          password_hash: string
          role: 'user' | 'super_admin'
          created_at: string
          last_login: string | null
        }
        Insert: {
          email: string
          password_hash: string
          role?: 'user' | 'super_admin'
          created_at?: string
          last_login?: string | null
        }
        Update: {
          email?: string
          password_hash?: string
          role?: 'user' | 'super_admin'
          created_at?: string
          last_login?: string | null
        }
      }
      videos: {
        Row: {
          id: number
          user_id: number | null
          url: string
          prompt: string
          animation_style: string
          timestamp: string
          drive_file_id: string | null
          drive_view_link: string | null
          drive_download_link: string | null
          is_stored_in_drive: boolean
        }
        Insert: {
          user_id?: number | null
          url: string
          prompt: string
          animation_style: string
          timestamp?: string
          drive_file_id?: string | null
          drive_view_link?: string | null
          drive_download_link?: string | null
          is_stored_in_drive?: boolean
        }
        Update: {
          user_id?: number | null
          url?: string
          prompt?: string
          animation_style?: string
          timestamp?: string
          drive_file_id?: string | null
          drive_view_link?: string | null
          drive_download_link?: string | null
          is_stored_in_drive?: boolean
        }
      }
      ai_models: {
        Row: {
          id: number
          name: string
          model_id: string
          api_key: string
          is_active: boolean
          created_at: string
        }
        Insert: {
          name: string
          model_id: string
          api_key: string
          is_active?: boolean
          created_at?: string
        }
        Update: {
          name?: string
          model_id?: string
          api_key?: string
          is_active?: boolean
          created_at?: string
        }
      }
    }
  }
}
