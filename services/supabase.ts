/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

// Debug logging to help identify configuration issues
console.log('Supabase URL:', supabaseUrl)
console.log('Supabase Anon Key exists:', !!supabaseAnonKey)

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Supabase configuration missing!')
  console.error('VITE_SUPABASE_URL:', supabaseUrl)
  console.error('VITE_SUPABASE_ANON_KEY exists:', !!supabaseAnonKey)
  console.error('Make sure your .env.local file has the correct variables')
}

if (supabaseUrl && !supabaseUrl.startsWith('https://')) {
  console.error('❌ Invalid Supabase URL format:', supabaseUrl)
  console.error('URL should start with https:// not postgres://')
}

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
          first_name: string | null
          last_name: string | null
          role: 'user' | 'super_admin'
          created_at: string
          last_login: string | null
        }
        Insert: {
          email: string
          password_hash: string
          first_name?: string | null
          last_name?: string | null
          role?: 'user' | 'super_admin'
          created_at?: string
          last_login?: string | null
        }
        Update: {
          email?: string
          password_hash?: string
          first_name?: string | null
          last_name?: string | null
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
