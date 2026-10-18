export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.17"
  }
  public: {
    Tables: {
      ai_call_log: {
        Row: {
          created_at: string
          id: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: number
          user_id?: string
        }
        Relationships: []
      }
      lesson_plans: {
        Row: {
          created_at: string
          duration_min: number | null
          grade: string | null
          id: string
          plan: Json
          regeneration_count: number
          standards: Json
          subject: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          duration_min?: number | null
          grade?: string | null
          id?: string
          plan?: Json
          regeneration_count?: number
          standards?: Json
          subject?: string | null
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          duration_min?: number | null
          grade?: string | null
          id?: string
          plan?: Json
          regeneration_count?: number
          standards?: Json
          subject?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      lesson_ratings: {
        Row: {
          created_at: string
          grade: string | null
          id: string
          lesson_id: string
          rating: number
          subject: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          grade?: string | null
          id?: string
          lesson_id: string
          rating: number
          subject?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          grade?: string | null
          id?: string
          lesson_id?: string
          rating?: number
          subject?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_ratings_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lesson_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          default_state: string | null
          display_name: string | null
          district: string | null
          id: string
          plan: string
          school: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          default_state?: string | null
          display_name?: string | null
          district?: string | null
          id?: string
          plan?: string
          school?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          default_state?: string | null
          display_name?: string | null
          district?: string | null
          id?: string
          plan?: string
          school?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      standards: {
        Row: {
          category: string | null
          ccss_id: string
          cluster_or_category: string | null
          code: string
          created_at: string
          domain_code: string | null
          domain_name: string | null
          grade: string
          id: string
          notes: string | null
          sort_order: number | null
          source_document: string | null
          source_url: string | null
          standard_text: string
          state: string | null
          subject: string
          text: string | null
        }
        Insert: {
          category?: string | null
          ccss_id: string
          cluster_or_category?: string | null
          code: string
          created_at?: string
          domain_code?: string | null
          domain_name?: string | null
          grade: string
          id?: string
          notes?: string | null
          sort_order?: number | null
          source_document?: string | null
          source_url?: string | null
          standard_text: string
          state?: string | null
          subject: string
          text?: string | null
        }
        Update: {
          category?: string | null
          ccss_id?: string
          cluster_or_category?: string | null
          code?: string
          created_at?: string
          domain_code?: string | null
          domain_name?: string | null
          grade?: string
          id?: string
          notes?: string | null
          sort_order?: number | null
          source_document?: string | null
          source_url?: string | null
          standard_text?: string
          state?: string | null
          subject?: string
          text?: string | null
        }
        Relationships: []
      }
      usage_monthly: {
        Row: {
          lesson_count: number
          period: string
          updated_at: string
          user_id: string
        }
        Insert: {
          lesson_count?: number
          period: string
          updated_at?: string
          user_id: string
        }
        Update: {
          lesson_count?: number
          period?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_my_usage: {
        Args: never
        Returns: {
          lessons_used: number
          plan: string
        }[]
      }
      increment_lesson_regeneration: {
        Args: { p_lesson_id: string; p_limit: number }
        Returns: number
      }
      increment_monthly_usage: { Args: { p_limit: number }; Returns: number }
      reserve_ai_call: {
        Args: { p_max: number; p_window_seconds: number }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
