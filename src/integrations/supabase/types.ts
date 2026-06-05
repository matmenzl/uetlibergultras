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
      achievement_suggestions: {
        Row: {
          admin_notes: string | null
          created_at: string
          description: string
          email: string | null
          how_to_earn: string
          id: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["suggestion_status"]
          title: string
          user_id: string
          wants_updates: boolean | null
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string
          description: string
          email?: string | null
          how_to_earn: string
          id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["suggestion_status"]
          title: string
          user_id: string
          wants_updates?: boolean | null
        }
        Update: {
          admin_notes?: string | null
          created_at?: string
          description?: string
          email?: string | null
          how_to_earn?: string
          id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["suggestion_status"]
          title?: string
          user_id?: string
          wants_updates?: boolean | null
        }
        Relationships: []
      }
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
          elevation_gain: number | null
          id: string
          is_manual: boolean | null
          segment_id: number
          source: string
          temperature: number | null
          upload_id: string | null
          user_id: string
          weather_code: number | null
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
          elevation_gain?: number | null
          id?: string
          is_manual?: boolean | null
          segment_id: number
          source?: string
          temperature?: number | null
          upload_id?: string | null
          user_id: string
          weather_code?: number | null
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
          elevation_gain?: number | null
          id?: string
          is_manual?: boolean | null
          segment_id?: number
          source?: string
          temperature?: number | null
          upload_id?: string | null
          user_id?: string
          weather_code?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "check_ins_upload_id_fkey"
            columns: ["upload_id"]
            isOneToOne: false
            referencedRelation: "manual_run_uploads"
            referencedColumns: ["id"]
          },
        ]
      }
      manual_run_uploads: {
        Row: {
          check_ins_created: number
          created_at: string
          distance_m: number | null
          elapsed_s: number | null
          error: string | null
          filename: string
          format: string
          id: string
          segments_matched: number
          started_at: string | null
          status: string
          trackpoint_count: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          check_ins_created?: number
          created_at?: string
          distance_m?: number | null
          elapsed_s?: number | null
          error?: string | null
          filename: string
          format: string
          id?: string
          segments_matched?: number
          started_at?: string | null
          status?: string
          trackpoint_count?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          check_ins_created?: number
          created_at?: string
          distance_m?: number | null
          elapsed_s?: number | null
          error?: string | null
          filename?: string
          format?: string
          id?: string
          segments_matched?: number
          started_at?: string | null
          status?: string
          trackpoint_count?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      monthly_challenge_winners: {
        Row: {
          awarded_at: string
          id: string
          month: number
          rank: number
          total_runs: number
          user_id: string
          year: number
        }
        Insert: {
          awarded_at?: string
          id?: string
          month: number
          rank: number
          total_runs: number
          user_id: string
          year: number
        }
        Update: {
          awarded_at?: string
          id?: string
          month?: number
          rank?: number
          total_runs?: number
          user_id?: string
          year?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          display_name: string | null
          first_name: string | null
          id: string
          initial_sync_completed: boolean | null
          initial_sync_months_done: number | null
          initial_sync_started_at: string | null
          is_founding_member: boolean | null
          is_test_account: boolean
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
          initial_sync_completed?: boolean | null
          initial_sync_months_done?: number | null
          initial_sync_started_at?: string | null
          is_founding_member?: boolean | null
          is_test_account?: boolean
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
          initial_sync_completed?: boolean | null
          initial_sync_months_done?: number | null
          initial_sync_started_at?: string | null
          is_founding_member?: boolean | null
          is_test_account?: boolean
          last_name?: string | null
          profile_picture?: string | null
          strava_id?: number | null
          updated_at?: string | null
          user_number?: number | null
        }
        Relationships: []
      }
      resync_jobs: {
        Row: {
          check_ins_created: number
          created_at: string
          created_by: string | null
          current_user_id: string | null
          finished_at: string | null
          id: string
          last_error: string | null
          last_heartbeat_at: string | null
          processed_user_ids: string[]
          rate_limit_long: number | null
          rate_limit_long_max: number | null
          rate_limit_short: number | null
          rate_limit_short_max: number | null
          resume_after: string | null
          segment_id: number | null
          started_at: string | null
          status: string
          total_users: number
        }
        Insert: {
          check_ins_created?: number
          created_at?: string
          created_by?: string | null
          current_user_id?: string | null
          finished_at?: string | null
          id?: string
          last_error?: string | null
          last_heartbeat_at?: string | null
          processed_user_ids?: string[]
          rate_limit_long?: number | null
          rate_limit_long_max?: number | null
          rate_limit_short?: number | null
          rate_limit_short_max?: number | null
          resume_after?: string | null
          segment_id?: number | null
          started_at?: string | null
          status?: string
          total_users?: number
        }
        Update: {
          check_ins_created?: number
          created_at?: string
          created_by?: string | null
          current_user_id?: string | null
          finished_at?: string | null
          id?: string
          last_error?: string | null
          last_heartbeat_at?: string | null
          processed_user_ids?: string[]
          rate_limit_long?: number | null
          rate_limit_long_max?: number | null
          rate_limit_short?: number | null
          rate_limit_short_max?: number | null
          resume_after?: string | null
          segment_id?: number | null
          started_at?: string | null
          status?: string
          total_users?: number
        }
        Relationships: []
      }
      segment_suggestions: {
        Row: {
          admin_notes: string | null
          created_at: string
          email: string | null
          id: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["suggestion_status"]
          strava_segment_url: string
          user_id: string
          wants_updates: boolean | null
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string
          email?: string | null
          id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["suggestion_status"]
          strava_segment_url: string
          user_id: string
          wants_updates?: boolean | null
        }
        Update: {
          admin_notes?: string | null
          created_at?: string
          email?: string | null
          id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["suggestion_status"]
          strava_segment_url?: string
          user_id?: string
          wants_updates?: boolean | null
        }
        Relationships: []
      }
      sitemap_submission_state: {
        Row: {
          id: string
          last_error: string | null
          last_hash: string | null
          last_status: string | null
          last_submitted_at: string | null
          last_trigger: string | null
          updated_at: string
        }
        Insert: {
          id: string
          last_error?: string | null
          last_hash?: string | null
          last_status?: string | null
          last_submitted_at?: string | null
          last_trigger?: string | null
          updated_at?: string
        }
        Update: {
          id?: string
          last_error?: string | null
          last_hash?: string | null
          last_status?: string | null
          last_submitted_at?: string | null
          last_trigger?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      strava_credentials: {
        Row: {
          auth_password_hash: string | null
          created_at: string | null
          id: string
          strava_access_token: string
          strava_refresh_token: string
          strava_token_expires_at: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          auth_password_hash?: string | null
          created_at?: string | null
          id?: string
          strava_access_token: string
          strava_refresh_token: string
          strava_token_expires_at?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          auth_password_hash?: string | null
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
      community_stats: {
        Row: {
          total_distance_km: number | null
          total_runners: number | null
          total_runs: number | null
        }
        Relationships: []
      }
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
      public_profiles: {
        Row: {
          display_name: string | null
          id: string | null
          is_founding_member: boolean | null
          profile_picture: string | null
          strava_id: number | null
          user_number: number | null
        }
        Insert: {
          display_name?: never
          id?: string | null
          is_founding_member?: boolean | null
          profile_picture?: string | null
          strava_id?: number | null
          user_number?: number | null
        }
        Update: {
          display_name?: never
          id?: string | null
          is_founding_member?: boolean | null
          profile_picture?: string | null
          strava_id?: number | null
          user_number?: number | null
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
      sitemap_cron_set_enabled: {
        Args: { _enabled: boolean }
        Returns: undefined
      }
      sitemap_cron_status: {
        Args: never
        Returns: {
          active: boolean
          jobid: number
          jobname: string
          schedule: string
        }[]
      }
      upsert_strava_credentials:
        | {
            Args: {
              _access_token: string
              _expires_at: string
              _refresh_token: string
              _user_id: string
            }
            Returns: undefined
          }
        | {
            Args: {
              _access_token: string
              _auth_password_hash?: string
              _expires_at: string
              _refresh_token: string
              _user_id: string
            }
            Returns: undefined
          }
      webcam_cron_set_enabled: {
        Args: { _enabled: boolean }
        Returns: undefined
      }
      webcam_cron_status: {
        Args: never
        Returns: {
          active: boolean
          jobid: number
          jobname: string
          schedule: string
        }[]
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
        | "denzlerweg_king"
        | "coiffeur"
        | "snow_bunny"
        | "frosty"
        | "alternativliga"
        | "wasserratte"
        | "monthly_gold"
        | "monthly_silver"
        | "monthly_bronze"
        | "jolly_jumper"
        | "seven_up"
        | "rote_laterne"
        | "led_head"
        | "uetli_xiv"
        | "fadegrad"
        | "staminal"
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
        "denzlerweg_king",
        "coiffeur",
        "snow_bunny",
        "frosty",
        "alternativliga",
        "wasserratte",
        "monthly_gold",
        "monthly_silver",
        "monthly_bronze",
        "jolly_jumper",
        "seven_up",
        "rote_laterne",
        "led_head",
        "uetli_xiv",
        "fadegrad",
        "staminal",
      ],
      app_role: ["admin", "user"],
      suggestion_status: ["pending", "approved", "rejected"],
    },
  },
} as const
