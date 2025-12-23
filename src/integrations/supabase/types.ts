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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      check_ins: {
        Row: {
          activity_distance: number | null
          activity_elapsed_time: number | null
          activity_id: number
          activity_name: string | null
          checked_in_at: string
          created_at: string
          distance: number | null
          elapsed_time: number | null
          id: string
          segment_id: number
          user_id: string
        }
        Insert: {
          activity_distance?: number | null
          activity_elapsed_time?: number | null
          activity_id: number
          activity_name?: string | null
          checked_in_at?: string
          created_at?: string
          distance?: number | null
          elapsed_time?: number | null
          id?: string
          segment_id: number
          user_id: string
        }
        Update: {
          activity_distance?: number | null
          activity_elapsed_time?: number | null
          activity_id?: number
          activity_name?: string | null
          checked_in_at?: string
          created_at?: string
          distance?: number | null
          elapsed_time?: number | null
          id?: string
          segment_id?: number
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          display_name: string | null
          first_name: string | null
          id: string
          is_founding_member: boolean | null
          last_name: string | null
          profile_picture: string | null
          strava_id: number | null
          updated_at: string | null
          user_number: number | null
        }
        Insert: {
          created_at?: string | null
          display_name?: string | null
          first_name?: string | null
          id: string
          is_founding_member?: boolean | null
          last_name?: string | null
          profile_picture?: string | null
          strava_id?: number | null
          updated_at?: string | null
          user_number?: number | null
        }
        Update: {
          created_at?: string | null
          display_name?: string | null
          first_name?: string | null
          id?: string
          is_founding_member?: boolean | null
          last_name?: string | null
          profile_picture?: string | null
          strava_id?: number | null
          updated_at?: string | null
          user_number?: number | null
        }
        Relationships: []
      }
      segment_suggestions: {
        Row: {
          admin_notes: string | null
          created_at: string
          id: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["suggestion_status"]
          strava_segment_url: string
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string
          id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["suggestion_status"]
          strava_segment_url: string
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          created_at?: string
          id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["suggestion_status"]
          strava_segment_url?: string
          user_id?: string
        }
        Relationships: []
      }
      strava_credentials: {
        Row: {
          created_at: string | null
          id: string
          strava_access_token: string
          strava_refresh_token: string
          strava_token_expires_at: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          strava_access_token: string
          strava_refresh_token: string
          strava_token_expires_at?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          strava_access_token?: string
          strava_refresh_token?: string
          strava_token_expires_at?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      uetliberg_segments: {
        Row: {
          avg_grade: number
          climb_category: number
          created_at: string | null
          distance: number
          distance_to_center: number | null
          effort_count: number | null
          elevation_high: number | null
          elevation_low: number | null
          end_latlng: unknown
          ends_at_uetliberg: boolean | null
          name: string
          polyline: string
          priority: string | null
          segment_id: number
          start_latlng: unknown
          updated_at: string | null
        }
        Insert: {
          avg_grade: number
          climb_category: number
          created_at?: string | null
          distance: number
          distance_to_center?: number | null
          effort_count?: number | null
          elevation_high?: number | null
          elevation_low?: number | null
          end_latlng: unknown
          ends_at_uetliberg?: boolean | null
          name: string
          polyline: string
          priority?: string | null
          segment_id: number
          start_latlng: unknown
          updated_at?: string | null
        }
        Update: {
          avg_grade?: number
          climb_category?: number
          created_at?: string | null
          distance?: number
          distance_to_center?: number | null
          effort_count?: number | null
          elevation_high?: number | null
          elevation_low?: number | null
          end_latlng?: unknown
          ends_at_uetliberg?: boolean | null
          name?: string
          polyline?: string
          priority?: string | null
          segment_id?: number
          start_latlng?: unknown
          updated_at?: string | null
        }
        Relationships: []
      }
      user_achievements: {
        Row: {
          achievement: Database["public"]["Enums"]["achievement_type"]
          earned_at: string
          id: string
          user_id: string
        }
        Insert: {
          achievement: Database["public"]["Enums"]["achievement_type"]
          earned_at?: string
          id?: string
          user_id: string
        }
        Update: {
          achievement?: Database["public"]["Enums"]["achievement_type"]
          earned_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      leaderboard_stats: {
        Row: {
          achievement_count: number | null
          display_name: string | null
          profile_picture: string | null
          total_runs: number | null
          unique_segments: number | null
          user_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      get_strava_credentials: {
        Args: { _user_id: string }
        Returns: {
          strava_access_token: string
          strava_refresh_token: string
          strava_token_expires_at: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      upsert_strava_credentials: {
        Args: {
          _access_token: string
          _expires_at: string
          _refresh_token: string
          _user_id: string
        }
        Returns: undefined
      }
    }
    Enums: {
      achievement_type:
        | "first_run"
        | "runs_5"
        | "runs_10"
        | "runs_25"
        | "runs_50"
        | "runs_100"
        | "all_segments"
        | "streak_2"
        | "streak_4"
        | "streak_8"
        | "early_bird"
        | "night_owl"
        | "pioneer_10"
        | "pioneer_25"
        | "pioneer_50"
        | "founding_member"
      app_role: "admin" | "user"
      suggestion_status: "pending" | "approved" | "rejected"
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      achievement_type: [
        "first_run",
        "runs_5",
        "runs_10",
        "runs_25",
        "runs_50",
        "runs_100",
        "all_segments",
        "streak_2",
        "streak_4",
        "streak_8",
        "early_bird",
        "night_owl",
        "pioneer_10",
        "pioneer_25",
        "pioneer_50",
        "founding_member",
      ],
      app_role: ["admin", "user"],
      suggestion_status: ["pending", "approved", "rejected"],
    },
  },
} as const
