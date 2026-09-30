// Auto-generate with: npx supabase gen types typescript --project-id YOUR_PROJECT_ID > types/database.ts
// This is a hand-crafted stub that matches schema.sql

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type AppRole = 'donor' | 'admin'
export type BloodType = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-'
export type GenderType = 'male' | 'female' | 'other'
export type UrgencyLevel = 'high' | 'mid' | 'low'
export type RequestStatus = 'open' | 'fulfilled' | 'expired' | 'cancelled'
export type NotificationStatus = 'notified' | 'confirmed' | 'declined' | 'no_response' | 'donated' | 'cancelled'
export type DeliveryStatus = 'pending' | 'sending' | 'sent' | 'failed'

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          role: AppRole
          full_name: string | null
          created_at: string
        }
        Insert: {
          id: string
          role?: AppRole
          full_name?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          role?: AppRole
          full_name?: string | null
          created_at?: string
        }
        Relationships: []
      }
      donors: {
        Row: {
          id: string
          user_id: string | null
          full_name: string
          date_of_birth: string
          gender: GenderType
          weight_kg: number
          blood_type: BloodType
          phone: string
          email: string | null
          last_donated: string | null
          available_from: string | null
          is_available: boolean
          is_active: boolean
          consent_given: boolean
          consent_at: string | null
          self_declared_eligible: boolean
          health_notes: Json
          address: string | null
          area: string | null
          city: string
          latitude: number
          longitude: number
          location: unknown | null
          preferred_channel: 'sms' | 'whatsapp' | 'email' | 'push'
          preferred_language: 'en' | 'bn'
          push_token: string | null
          show_on_leaderboard: boolean
          donation_count: number
          no_response_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          full_name: string
          date_of_birth: string
          gender: GenderType
          weight_kg: number
          blood_type: BloodType
          phone: string
          email?: string | null
          last_donated?: string | null
          available_from?: string | null
          is_available?: boolean
          is_active?: boolean
          consent_given?: boolean
          consent_at?: string | null
          self_declared_eligible?: boolean
          health_notes?: Json
          address?: string | null
          area?: string | null
          city?: string
          latitude: number
          longitude: number
          preferred_channel?: 'sms' | 'whatsapp' | 'email' | 'push'
          preferred_language?: 'en' | 'bn'
          push_token?: string | null
          show_on_leaderboard?: boolean
          donation_count?: number
          no_response_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['donors']['Insert']>
        Relationships: []
      }
      hospitals: {
        Row: {
          id: string
          name: string
          name_bn: string | null
          address: string | null
          area: string | null
          city: string
          phone: string | null
          latitude: number
          longitude: number
          location: unknown | null
          is_verified: boolean
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          name_bn?: string | null
          address?: string | null
          area?: string | null
          city?: string
          phone?: string | null
          latitude: number
          longitude: number
          is_verified?: boolean
          is_active?: boolean
        }
        Update: Partial<Database['public']['Tables']['hospitals']['Insert']>
        Relationships: []
      }
      blood_banks: {
        Row: {
          id: string
          name: string
          phone: string | null
          address: string | null
          area: string | null
          city: string
          open_hours: string | null
          latitude: number
          longitude: number
          location: unknown | null
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          phone?: string | null
          address?: string | null
          area?: string | null
          city?: string
          open_hours?: string | null
          latitude: number
          longitude: number
          is_active?: boolean
        }
        Update: Partial<Database['public']['Tables']['blood_banks']['Insert']>
        Relationships: []
      }
      blood_requests: {
        Row: {
          id: string
          public_token: string
          patient_name: string | null
          patient_gender: GenderType
          blood_type: BloodType
          units_needed: number
          urgency: UrgencyLevel
          hospital_id: string | null
          hospital_name: string
          hospital_address: string | null
          latitude: number
          longitude: number
          location: unknown
          contact_1: string
          contact_2: string | null
          requester_name: string | null
          notes: string | null
          needed_by: string | null
          status: RequestStatus
          current_wave: number
          radius_km: number
          next_escalation_at: string | null
          escalation_exhausted: boolean
          expires_at: string | null
          ip_hash: string | null
          fulfilled_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          public_token?: string
          patient_name?: string | null
          patient_gender: GenderType
          blood_type: BloodType
          units_needed: number
          urgency?: UrgencyLevel
          hospital_id?: string | null
          hospital_name: string
          hospital_address?: string | null
          latitude: number
          longitude: number
          contact_1: string
          contact_2?: string | null
          requester_name?: string | null
          notes?: string | null
          needed_by?: string | null
          status?: RequestStatus
          expires_at?: string | null
          ip_hash?: string | null
        }
        Update: Partial<Database['public']['Tables']['blood_requests']['Insert']>
        Relationships: []
      }
      request_notifications: {
        Row: {
          id: string
          request_id: string
          donor_id: string
          wave: number
          rank: number
          distance_km: number | null
          status: NotificationStatus
          response_token: string
          delivery_status: DeliveryStatus
          delivery_channel: string | null
          delivery_attempts: number
          delivery_error: string | null
          last_attempt_at: string | null
          sent_at: string | null
          notified_at: string
          responded_at: string | null
          donated_at: string | null
        }
        Insert: {
          id?: string
          request_id: string
          donor_id: string
          wave?: number
          rank: number
          distance_km?: number | null
          status?: NotificationStatus
          response_token?: string
        }
        Update: Partial<Database['public']['Tables']['request_notifications']['Insert']>
        Relationships: []
      }
      donation_history: {
        Row: {
          id: string
          donor_id: string
          request_id: string | null
          donated_on: string
          units: number
          created_at: string
        }
        Insert: {
          id?: string
          donor_id: string
          request_id?: string | null
          donated_on?: string
          units?: number
        }
        Update: Partial<Database['public']['Tables']['donation_history']['Insert']>
        Relationships: []
      }
      contact_access_log: {
        Row: {
          id: string
          request_id: string | null
          notification_id: string | null
          viewer_type: 'requester' | 'donor' | 'admin'
          kind: 'view' | 'call' | 'whatsapp'
          created_at: string
        }
        Insert: {
          id?: string
          request_id?: string | null
          notification_id?: string | null
          viewer_type: 'requester' | 'donor' | 'admin'
          kind: 'view' | 'call' | 'whatsapp'
        }
        Update: Partial<Database['public']['Tables']['contact_access_log']['Insert']>
        Relationships: []
      }
      app_settings: {
        Row: { key: string; value: Json; description: string | null }
        Insert: { key: string; value: Json; description?: string | null }
        Update: { key?: string; value?: Json; description?: string | null }
        Relationships: []
      }
    }
    Views: {
      donors_with_status: {
        Row: Database['public']['Tables']['donors']['Row'] & {
          availability_status: 'available' | 'cooldown' | 'paused' | 'inactive'
        }
        Relationships: []
      }
    }
    Functions: {
      search_hospitals: {
        Args: { p_query: string; p_limit?: number }
        Returns: Array<{ id: string; name: string; address: string | null; area: string | null; latitude: number; longitude: number }>
      }
      nearest_blood_banks: {
        Args: { p_lat: number; p_lng: number; p_limit?: number }
        Returns: Array<{ id: string; name: string; phone: string | null; address: string | null; area: string | null; open_hours: string | null; distance_km: number }>
      }
      get_leaderboard: {
        Args: { p_limit?: number }
        Returns: Array<{ display_name: string; area: string | null; donation_count: number; last_donated: string | null }>
      }
      get_notification_by_token: {
        Args: { p_token: string }
        Returns: {
          notification: {
            status: NotificationStatus
            distance_km: number | null
            wave: number
            donated_at: string | null
          }
          donor: { name: string; blood_type: BloodType }
          request: {
            status: RequestStatus
            blood_type: BloodType
            units_needed: number
            urgency: UrgencyLevel
            hospital_name: string
            hospital_address: string | null
            latitude: number
            longitude: number
            needed_by: string | null
            created_at: string
          }
          contacts: {
            contact_1: string
            contact_2: string | null
            requester_name: string | null
            patient_gender: GenderType
          } | null
        } | null
      }
      respond_to_notification: {
        Args: { p_token: string; p_action: string }
        Returns: Json
      }
      get_request_status: {
        Args: { p_request_id: string; p_token: string }
        Returns: Json
      }
      patient_mark_donated: {
        Args: { p_request_id: string; p_token: string; p_notification_id: string }
        Returns: Json
      }
      close_request: {
        Args: { p_request_id: string; p_token: string; p_new_status: RequestStatus }
        Returns: Json
      }
      log_contact_access: {
        Args: { p_request_id: string; p_notification_id: string; p_viewer: string; p_kind: string }
        Returns: void
      }
      claim_pending_notifications: {
        Args: { p_limit?: number }
        Returns: Array<{
          notification_id: string
          response_token: string
          donor_name: string
          donor_phone: string
          donor_email: string | null
          preferred_channel: string
          preferred_language: string
          blood_type: BloodType
          units_needed: number
          urgency: UrgencyLevel
          hospital_name: string
          distance_km: number | null
        }>
      }
      mark_notification_delivery: {
        Args: { p_id: string; p_ok: boolean; p_channel: string; p_error?: string | null }
        Returns: void
      }
      admin_dashboard_stats: {
        Args: Record<string, never>
        Returns: Json
      }
      is_admin: {
        Args: Record<string, never>
        Returns: boolean
      }
      compatible_donor_types: {
        Args: { p_patient: BloodType }
        Returns: BloodType[]
      }
    }
    Enums: {
      app_role: AppRole
      blood_type_enum: BloodType
      gender_type: GenderType
      urgency_level: UrgencyLevel
      request_status: RequestStatus
      notification_status: NotificationStatus
      delivery_status: DeliveryStatus
    }
  }
}
