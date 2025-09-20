export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          role: 'homeroom' | 'specialist'
          grade: number | null
          class_number: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          role: 'homeroom' | 'specialist'
          grade?: number | null
          class_number?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          role?: 'homeroom' | 'specialist'
          grade?: number | null
          class_number?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      subjects: {
        Row: {
          id: string
          name: string
          category: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          category?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          category?: string | null
          created_at?: string
        }
      }
      publishers: {
        Row: {
          id: string
          name: string
          code: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          code: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          code?: string
          created_at?: string
        }
      }
      user_subjects: {
        Row: {
          id: string
          user_id: string
          subject_id: string
          grade: number
          class_number: number | null
          publisher_id: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          subject_id: string
          grade: number
          class_number?: number | null
          publisher_id: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          subject_id?: string
          grade?: number
          class_number?: number | null
          publisher_id?: string
          created_at?: string
        }
      }
      school_settings: {
        Row: {
          id: string
          user_id: string
          prefecture: string | null
          academic_year: number
          spring_break_start: string | null
          spring_break_end: string | null
          summer_break_start: string | null
          summer_break_end: string | null
          winter_break_start: string | null
          winter_break_end: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          prefecture?: string | null
          academic_year: number
          spring_break_start?: string | null
          spring_break_end?: string | null
          summer_break_start?: string | null
          summer_break_end?: string | null
          winter_break_start?: string | null
          winter_break_end?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          prefecture?: string | null
          academic_year?: number
          spring_break_start?: string | null
          spring_break_end?: string | null
          summer_break_start?: string | null
          summer_break_end?: string | null
          winter_break_start?: string | null
          winter_break_end?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      schedules: {
        Row: {
          id: string
          user_id: string
          name: string | null
          is_default: boolean | null
          start_date: string | null
          end_date: string | null
          daily_periods: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name?: string | null
          is_default?: boolean | null
          start_date?: string | null
          end_date?: string | null
          daily_periods?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string | null
          is_default?: boolean | null
          start_date?: string | null
          end_date?: string | null
          daily_periods?: Json | null
          created_at?: string
        }
      }
      schedule_details: {
        Row: {
          id: string
          schedule_id: string
          day_of_week: number
          period: number
          subject_id: string | null
          grade: number | null
          class_number: number | null
          created_at: string
        }
        Insert: {
          id?: string
          schedule_id: string
          day_of_week: number
          period: number
          subject_id?: string | null
          grade?: number | null
          class_number?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          schedule_id?: string
          day_of_week?: number
          period?: number
          subject_id?: string | null
          grade?: number | null
          class_number?: number | null
          created_at?: string
        }
      }
      school_events: {
        Row: {
          id: string
          user_id: string
          name: string
          event_date: string
          event_type: string | null
          schedule_id: string | null
          hours_fraction: number | null
          memo: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          event_date: string
          event_type?: string | null
          schedule_id?: string | null
          hours_fraction?: number | null
          memo?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          event_date?: string
          event_type?: string | null
          schedule_id?: string | null
          hours_fraction?: number | null
          memo?: string | null
          created_at?: string
        }
      }
      textbook_units: {
        Row: {
          id: string
          publisher_id: string
          subject_id: string
          grade: number
          unit_order: number
          unit_name: string
          category: string | null
          suggested_hours: number
          suggested_period: string | null
          created_at: string
        }
        Insert: {
          id?: string
          publisher_id: string
          subject_id: string
          grade: number
          unit_order: number
          unit_name: string
          category?: string | null
          suggested_hours: number
          suggested_period?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          publisher_id?: string
          subject_id?: string
          grade?: number
          unit_order?: number
          unit_name?: string
          category?: string | null
          suggested_hours?: number
          suggested_period?: string | null
          created_at?: string
        }
      }
      weekly_plans: {
        Row: {
          id: string
          user_id: string
          academic_year: number
          week_start_date: string
          week_end_date: string
          status: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          academic_year: number
          week_start_date: string
          week_end_date: string
          status?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          academic_year?: number
          week_start_date?: string
          week_end_date?: string
          status?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      weekly_plan_details: {
        Row: {
          id: string
          weekly_plan_id: string
          day_of_week: number
          period: number
          subject_id: string | null
          unit_id: string | null
          grade: number | null
          class_number: number | null
          hours: number | null
          memo: string | null
          created_at: string
        }
        Insert: {
          id?: string
          weekly_plan_id: string
          day_of_week: number
          period: number
          subject_id?: string | null
          unit_id?: string | null
          grade?: number | null
          class_number?: number | null
          hours?: number | null
          memo?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          weekly_plan_id?: string
          day_of_week?: number
          period?: number
          subject_id?: string | null
          unit_id?: string | null
          grade?: number | null
          class_number?: number | null
          hours?: number | null
          memo?: string | null
          created_at?: string
        }
      }
      hours_management: {
        Row: {
          id: string
          user_id: string
          subject_id: string
          grade: number
          academic_year: number
          month: number
          planned_hours: number | null
          actual_hours: number | null
          cumulative_planned: number | null
          cumulative_actual: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          subject_id: string
          grade: number
          academic_year: number
          month: number
          planned_hours?: number | null
          actual_hours?: number | null
          cumulative_planned?: number | null
          cumulative_actual?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          subject_id?: string
          grade?: number
          academic_year?: number
          month?: number
          planned_hours?: number | null
          actual_hours?: number | null
          cumulative_planned?: number | null
          cumulative_actual?: number | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Utility types for easier usage
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type TablesInsert<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type TablesUpdate<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']