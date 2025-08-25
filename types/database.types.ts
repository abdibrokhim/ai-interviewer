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
          anonymous: boolean | null
          created_at: string | null
          display_name: string | null
          email: string
          id: string
          profile_image: string | null
          last_active_at: string | null
          role: Database["public"]["Enums"]["user_role"]
        }
        Insert: {
          anonymous?: boolean | null
          created_at?: string | null
          display_name?: string | null
          email: string
          id: string
          profile_image?: string | null
          last_active_at?: string | null
          role?: Database["public"]["Enums"]["user_role"]
        }
        Update: {
          anonymous?: boolean | null
          created_at?: string | null
          display_name?: string | null
          email?: string
          id?: string
          profile_image?: string | null
          last_active_at?: string | null
          role?: Database["public"]["Enums"]["user_role"]
        }
        Relationships: []
      }
      , companies: {
        Row: {
          id: string
          name: string
          description: string | null
          size: string | null
          location: string | null
          website: string | null
          created_by: string
          credits_balance: number
          plan: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          size?: string | null
          location?: string | null
          website?: string | null
          created_by: string
          credits_balance?: number
          plan?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          size?: string | null
          location?: string | null
          website?: string | null
          created_by?: string
          credits_balance?: number
          plan?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "companies_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      , company_members: {
        Row: {
          id: string
          company_id: string
          user_id: string
          role: Database["public"]["Enums"]["member_role"]
          created_at: string | null
        }
        Insert: {
          id?: string
          company_id: string
          user_id: string
          role?: Database["public"]["Enums"]["member_role"]
          created_at?: string | null
        }
        Update: {
          id?: string
          company_id?: string
          user_id?: string
          role?: Database["public"]["Enums"]["member_role"]
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "company_members_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      , jobs: {
        Row: {
          id: string
          company_id: string
          title: string
          description: string | null
          tech_stack: string[]
          experience_min: number | null
          experience_max: number | null
          salary_min: number | null
          salary_max: number | null
          currency: string
          location: string | null
          remote_type: Database["public"]["Enums"]["remote_type"] | null
          status: Database["public"]["Enums"]["job_status"]
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          company_id: string
          title: string
          description?: string | null
          tech_stack?: string[]
          experience_min?: number | null
          experience_max?: number | null
          salary_min?: number | null
          salary_max?: number | null
          currency?: string
          location?: string | null
          remote_type?: Database["public"]["Enums"]["remote_type"] | null
          status?: Database["public"]["Enums"]["job_status"]
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          company_id?: string
          title?: string
          description?: string | null
          tech_stack?: string[]
          experience_min?: number | null
          experience_max?: number | null
          salary_min?: number | null
          salary_max?: number | null
          currency?: string
          location?: string | null
          remote_type?: Database["public"]["Enums"]["remote_type"] | null
          status?: Database["public"]["Enums"]["job_status"]
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "jobs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      , applications: {
        Row: {
          id: string
          job_id: string
          candidate_id: string | null
          candidate_email: string
          resume_url: string | null
          cover_letter: string | null
          status: Database["public"]["Enums"]["application_status"]
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          job_id: string
          candidate_id?: string | null
          candidate_email: string
          resume_url?: string | null
          cover_letter?: string | null
          status?: Database["public"]["Enums"]["application_status"]
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          job_id?: string
          candidate_id?: string | null
          candidate_email?: string
          resume_url?: string | null
          cover_letter?: string | null
          status?: Database["public"]["Enums"]["application_status"]
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "applications_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applications_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      , interviews: {
        Row: {
          id: string
          company_id: string
          created_by: string
          job_id: string | null
          application_id: string | null
          candidate_id: string | null
          candidate_email: string
          candidate_name: string | null
          interview_type: Database["public"]["Enums"]["interview_type"]
          num_questions: number | null
          skills: string[]
          depth: string
          question_source: Database["public"]["Enums"]["question_source"]
          minutes_duration: number
          scheduled_at: string | null
          timezone: string | null
          status: Database["public"]["Enums"]["interview_status"]
          invite_token: string | null
          invite_expires_at: string | null
          reschedule_allowed_count: number
          credits_estimated: number | null
          credits_spent: number | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          company_id: string
          created_by: string
          job_id?: string | null
          application_id?: string | null
          candidate_id?: string | null
          candidate_email: string
          candidate_name?: string | null
          interview_type: Database["public"]["Enums"]["interview_type"]
          num_questions?: number | null
          skills?: string[]
          depth?: string
          question_source?: Database["public"]["Enums"]["question_source"]
          minutes_duration: number
          scheduled_at?: string | null
          timezone?: string | null
          status?: Database["public"]["Enums"]["interview_status"]
          invite_token?: string | null
          invite_expires_at?: string | null
          reschedule_allowed_count?: number
          credits_estimated?: number | null
          credits_spent?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          company_id?: string
          created_by?: string
          job_id?: string | null
          application_id?: string | null
          candidate_id?: string | null
          candidate_email?: string
          candidate_name?: string | null
          interview_type?: Database["public"]["Enums"]["interview_type"]
          num_questions?: number | null
          skills?: string[]
          depth?: string
          question_source?: Database["public"]["Enums"]["question_source"]
          minutes_duration?: number
          scheduled_at?: string | null
          timezone?: string | null
          status?: Database["public"]["Enums"]["interview_status"]
          invite_token?: string | null
          invite_expires_at?: string | null
          reschedule_allowed_count?: number
          credits_estimated?: number | null
          credits_spent?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "interviews_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interviews_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interviews_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interviews_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interviews_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      , interview_sessions: {
        Row: {
          id: string
          interview_id: string
          scheduled_at: string | null
          started_at: string | null
          ended_at: string | null
          status: string | null
          reschedule_count: number
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          interview_id: string
          scheduled_at?: string | null
          started_at?: string | null
          ended_at?: string | null
          status?: string | null
          reschedule_count?: number
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          interview_id?: string
          scheduled_at?: string | null
          started_at?: string | null
          ended_at?: string | null
          status?: string | null
          reschedule_count?: number
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "interview_sessions_interview_id_fkey"
            columns: ["interview_id"]
            isOneToOne: false
            referencedRelation: "interviews"
            referencedColumns: ["id"]
          },
        ]
      }
      , interview_results: {
        Row: {
          id: string
          interview_id: string
          overall_score: number | null
          scores: Json | null
          transcript_url: string | null
          transcript: string | null
          video_url: string | null
          flagged_cheating: boolean | null
          flags: Json | null
          notes: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          interview_id: string
          overall_score?: number | null
          scores?: Json | null
          transcript_url?: string | null
          transcript?: string | null
          video_url?: string | null
          flagged_cheating?: boolean | null
          flags?: Json | null
          notes?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          interview_id?: string
          overall_score?: number | null
          scores?: Json | null
          transcript_url?: string | null
          transcript?: string | null
          video_url?: string | null
          flagged_cheating?: boolean | null
          flags?: Json | null
          notes?: string | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "interview_results_interview_id_fkey"
            columns: ["interview_id"]
            isOneToOne: false
            referencedRelation: "interviews"
            referencedColumns: ["id"]
          },
        ]
      }
      , question_templates: {
        Row: {
          id: string
          title: string
          description: string | null
          job_role: string | null
          content: Json
          is_public: boolean
          created_by: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          job_role?: string | null
          content: Json
          is_public?: boolean
          created_by?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          job_role?: string | null
          content?: Json
          is_public?: boolean
          created_by?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "question_templates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      , credit_packages: {
        Row: {
          id: string
          name: string
          credits: number
          price_cents: number
          currency: string
          is_active: boolean
          created_at: string | null
        }
        Insert: {
          id?: string
          name: string
          credits: number
          price_cents: number
          currency?: string
          is_active?: boolean
          created_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          credits?: number
          price_cents?: number
          currency?: string
          is_active?: boolean
          created_at?: string | null
        }
        Relationships: []
      }
      , orders: {
        Row: {
          id: string
          company_id: string
          package_id: string | null
          credits: number
          amount_cents: number
          currency: string
          status: Database["public"]["Enums"]["orderstatus"]
          payment_provider: string | null
          provider_ref: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          company_id: string
          package_id?: string | null
          credits: number
          amount_cents: number
          currency?: string
          status?: Database["public"]["Enums"]["orderstatus"]
          payment_provider?: string | null
          provider_ref?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          company_id?: string
          package_id?: string | null
          credits?: number
          amount_cents?: number
          currency?: string
          status?: Database["public"]["Enums"]["orderstatus"]
          payment_provider?: string | null
          provider_ref?: string | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "credit_packages"
            referencedColumns: ["id"]
          },
        ]
      }
      , credit_transactions: {
        Row: {
          id: string
          company_id: string
          delta_credits: number
          reason: string
          related_type: string | null
          related_id: string | null
          balance_after: number | null
          created_at: string | null
        }
        Insert: {
          id?: string
          company_id: string
          delta_credits: number
          reason: string
          related_type?: string | null
          related_id?: string | null
          balance_after?: number | null
          created_at?: string | null
        }
        Update: {
          id?: string
          company_id?: string
          delta_credits?: number
          reason?: string
          related_type?: string | null
          related_id?: string | null
          balance_after?: number | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "credit_transactions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      user_role: "candidate" | "employer" | "admin"
      remote_type: "REMOTE" | "HYBRID" | "ONSITE"
      interview_type: "TECHNICAL" | "CODING" | "BEHAVIORAL" | "SITUATIONAL" | "MIXED"
      interview_status: "DRAFT" | "SCHEDULED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED" | "EXPIRED"
      application_status: "APPLIED" | "ASSIGNED_INTERVIEW" | "SELECTED" | "NEXT_ROUND" | "OFFER_SENT" | "REJECTED" | "WITHDRAWN"
      member_role: "owner" | "admin" | "member"
      question_source: "MANUAL" | "JOB_DESCRIPTION" | "TEMPLATE" | "AI"
      job_status: "DRAFT" | "OPEN" | "PAUSED" | "CLOSED"
      orderstatus:
        | "UNPAID"
        | "PAID"
        | "SHIPPED"
        | "OUT"
        | "CANCELLED"
        | "PENDING"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
