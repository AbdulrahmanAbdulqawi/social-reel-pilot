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
      audit_logs: {
        Row: {
          action: string
          admin_id: string | null
          created_at: string
          details: Json | null
          entity_id: string | null
          entity_type: string
          id: string
        }
        Insert: {
          action: string
          admin_id?: string | null
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type: string
          id?: string
        }
        Update: {
          action?: string
          admin_id?: string | null
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type?: string
          id?: string
        }
        Relationships: []
      }
      email_logs: {
        Row: {
          created_at: string
          email_to: string
          email_type: string
          error_message: string | null
          id: string
          metadata: Json | null
          resend_id: string | null
          sent_at: string | null
          status: string
          subject: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email_to: string
          email_type: string
          error_message?: string | null
          id?: string
          metadata?: Json | null
          resend_id?: string | null
          sent_at?: string | null
          status?: string
          subject: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email_to?: string
          email_type?: string
          error_message?: string | null
          id?: string
          metadata?: Json | null
          resend_id?: string | null
          sent_at?: string | null
          status?: string
          subject?: string
          user_id?: string | null
        }
        Relationships: []
      }
      notification_preferences: {
        Row: {
          analytics_milestone: boolean | null
          created_at: string
          draft_comment: boolean | null
          email_verification: boolean | null
          id: string
          login_new_device: boolean | null
          monthly_report: boolean | null
          password_reset: boolean | null
          payment_failed: boolean | null
          platform_disconnected: boolean | null
          post_approval: boolean | null
          post_failed: boolean | null
          post_published: boolean | null
          scheduled_reminder: boolean | null
          subscription_expired: boolean | null
          subscription_renewal: boolean | null
          team_invitation: boolean | null
          top_post_notification: boolean | null
          updated_at: string
          usage_limit_warning: boolean | null
          user_id: string
          weekly_summary: boolean | null
          welcome_email: boolean | null
        }
        Insert: {
          analytics_milestone?: boolean | null
          created_at?: string
          draft_comment?: boolean | null
          email_verification?: boolean | null
          id?: string
          login_new_device?: boolean | null
          monthly_report?: boolean | null
          password_reset?: boolean | null
          payment_failed?: boolean | null
          platform_disconnected?: boolean | null
          post_approval?: boolean | null
          post_failed?: boolean | null
          post_published?: boolean | null
          scheduled_reminder?: boolean | null
          subscription_expired?: boolean | null
          subscription_renewal?: boolean | null
          team_invitation?: boolean | null
          top_post_notification?: boolean | null
          updated_at?: string
          usage_limit_warning?: boolean | null
          user_id: string
          weekly_summary?: boolean | null
          welcome_email?: boolean | null
        }
        Update: {
          analytics_milestone?: boolean | null
          created_at?: string
          draft_comment?: boolean | null
          email_verification?: boolean | null
          id?: string
          login_new_device?: boolean | null
          monthly_report?: boolean | null
          password_reset?: boolean | null
          payment_failed?: boolean | null
          platform_disconnected?: boolean | null
          post_approval?: boolean | null
          post_failed?: boolean | null
          post_published?: boolean | null
          scheduled_reminder?: boolean | null
          subscription_expired?: boolean | null
          subscription_renewal?: boolean | null
          team_invitation?: boolean | null
          top_post_notification?: boolean | null
          updated_at?: string
          usage_limit_warning?: boolean | null
          user_id?: string
          weekly_summary?: boolean | null
          welcome_email?: boolean | null
        }
        Relationships: []
      }
      platform_accounts: {
        Row: {
          access_token: string | null
          connected_at: string
          expires_at: string | null
          id: string
          platform: Database["public"]["Enums"]["platform_type"]
          refresh_token: string | null
          user_id: string
        }
        Insert: {
          access_token?: string | null
          connected_at?: string
          expires_at?: string | null
          id?: string
          platform: Database["public"]["Enums"]["platform_type"]
          refresh_token?: string | null
          user_id: string
        }
        Update: {
          access_token?: string | null
          connected_at?: string
          expires_at?: string | null
          id?: string
          platform?: Database["public"]["Enums"]["platform_type"]
          refresh_token?: string | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          email_verification_sent_at: string | null
          email_verification_token: string | null
          email_verified: boolean | null
          getlate_profile_id: string | null
          id: string
          onboarding_completed: boolean | null
          onboarding_started_at: string | null
          onboarding_step: number | null
          updated_at: string
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          email_verification_sent_at?: string | null
          email_verification_token?: string | null
          email_verified?: boolean | null
          getlate_profile_id?: string | null
          id: string
          onboarding_completed?: boolean | null
          onboarding_started_at?: string | null
          onboarding_step?: number | null
          updated_at?: string
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          email_verification_sent_at?: string | null
          email_verification_token?: string | null
          email_verified?: boolean | null
          getlate_profile_id?: string | null
          id?: string
          onboarding_completed?: boolean | null
          onboarding_started_at?: string | null
          onboarding_step?: number | null
          updated_at?: string
          username?: string | null
        }
        Relationships: []
      }
      reel_analytics: {
        Row: {
          comments: number | null
          fetched_at: string
          id: string
          likes: number | null
          platform_response_id: string | null
          reel_id: string
          shares: number | null
          views: number | null
        }
        Insert: {
          comments?: number | null
          fetched_at?: string
          id?: string
          likes?: number | null
          platform_response_id?: string | null
          reel_id: string
          shares?: number | null
          views?: number | null
        }
        Update: {
          comments?: number | null
          fetched_at?: string
          id?: string
          likes?: number | null
          platform_response_id?: string | null
          reel_id?: string
          shares?: number | null
          views?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "reel_analytics_reel_id_fkey"
            columns: ["reel_id"]
            isOneToOne: false
            referencedRelation: "reels"
            referencedColumns: ["id"]
          },
        ]
      }
      reels: {
        Row: {
          caption: string | null
          created_at: string
          getlate_post_id: string | null
          hashtags: string[] | null
          id: string
          media_items: Json | null
          media_type: string | null
          platform: Database["public"]["Enums"]["platform_type"]
          platforms: string[] | null
          posted_at: string | null
          posting_method: string | null
          scheduled_at: string | null
          status: Database["public"]["Enums"]["reel_status"]
          thumbnail_url: string | null
          title: string
          updated_at: string
          user_id: string
          video_url: string | null
        }
        Insert: {
          caption?: string | null
          created_at?: string
          getlate_post_id?: string | null
          hashtags?: string[] | null
          id?: string
          media_items?: Json | null
          media_type?: string | null
          platform: Database["public"]["Enums"]["platform_type"]
          platforms?: string[] | null
          posted_at?: string | null
          posting_method?: string | null
          scheduled_at?: string | null
          status?: Database["public"]["Enums"]["reel_status"]
          thumbnail_url?: string | null
          title: string
          updated_at?: string
          user_id: string
          video_url?: string | null
        }
        Update: {
          caption?: string | null
          created_at?: string
          getlate_post_id?: string | null
          hashtags?: string[] | null
          id?: string
          media_items?: Json | null
          media_type?: string | null
          platform?: Database["public"]["Enums"]["platform_type"]
          platforms?: string[] | null
          posted_at?: string | null
          posting_method?: string | null
          scheduled_at?: string | null
          status?: Database["public"]["Enums"]["reel_status"]
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
          user_id?: string
          video_url?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_subscriptions: {
        Row: {
          created_at: string
          current_period_end: string
          current_period_start: string
          id: string
          plan_type: Database["public"]["Enums"]["subscription_plan"]
          posts_limit: number
          status: Database["public"]["Enums"]["subscription_status"]
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_period_end?: string
          current_period_start?: string
          id?: string
          plan_type?: Database["public"]["Enums"]["subscription_plan"]
          posts_limit?: number
          status?: Database["public"]["Enums"]["subscription_status"]
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_period_end?: string
          current_period_start?: string
          id?: string
          plan_type?: Database["public"]["Enums"]["subscription_plan"]
          posts_limit?: number
          status?: Database["public"]["Enums"]["subscription_status"]
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
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
      can_user_create_post: {
        Args: { user_id_param: string }
        Returns: boolean
      }
      get_remaining_posts: { Args: { user_id_param: string }; Returns: number }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      platform_type: "instagram" | "tiktok" | "youtube"
      reel_status: "draft" | "scheduled" | "posted" | "failed"
      subscription_plan: "free_trial" | "premium"
      subscription_status: "active" | "canceled" | "expired"
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
      app_role: ["admin", "moderator", "user"],
      platform_type: ["instagram", "tiktok", "youtube"],
      reel_status: ["draft", "scheduled", "posted", "failed"],
      subscription_plan: ["free_trial", "premium"],
      subscription_status: ["active", "canceled", "expired"],
    },
  },
} as const
