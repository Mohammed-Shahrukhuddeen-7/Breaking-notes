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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      ai_quizzes: {
        Row: {
          created_at: string
          id: string
          note_id: string
          quiz_json: Json
        }
        Insert: {
          created_at?: string
          id?: string
          note_id: string
          quiz_json: Json
        }
        Update: {
          created_at?: string
          id?: string
          note_id?: string
          quiz_json?: Json
        }
        Relationships: [
          {
            foreignKeyName: "ai_quizzes_note_id_fkey"
            columns: ["note_id"]
            isOneToOne: true
            referencedRelation: "notes"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_summaries: {
        Row: {
          created_at: string
          formulas: string | null
          id: string
          key_concepts: string | null
          note_id: string
          revision_points: string | null
          summary: string
        }
        Insert: {
          created_at?: string
          formulas?: string | null
          id?: string
          key_concepts?: string | null
          note_id: string
          revision_points?: string | null
          summary: string
        }
        Update: {
          created_at?: string
          formulas?: string | null
          id?: string
          key_concepts?: string | null
          note_id?: string
          revision_points?: string | null
          summary?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_summaries_note_id_fkey"
            columns: ["note_id"]
            isOneToOne: true
            referencedRelation: "notes"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_usage: {
        Row: {
          id: string
          requests_used: number
          updated_at: string
          usage_date: string
          user_id: string
        }
        Insert: {
          id?: string
          requests_used?: number
          updated_at?: string
          usage_date?: string
          user_id: string
        }
        Update: {
          id?: string
          requests_used?: number
          updated_at?: string
          usage_date?: string
          user_id?: string
        }
        Relationships: []
      }
      notes: {
        Row: {
          created_at: string
          file_name: string
          file_size: number | null
          id: string
          mime_type: string
          semester_id: string
          storage_path: string
          subject_id: string
          tag: Database["public"]["Enums"]["note_tag"]
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string
          file_name: string
          file_size?: number | null
          id?: string
          mime_type: string
          semester_id: string
          storage_path: string
          subject_id: string
          tag?: Database["public"]["Enums"]["note_tag"]
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string
          file_name?: string
          file_size?: number | null
          id?: string
          mime_type?: string
          semester_id?: string
          storage_path?: string
          subject_id?: string
          tag?: Database["public"]["Enums"]["note_tag"]
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notes_semester_id_fkey"
            columns: ["semester_id"]
            isOneToOne: false
            referencedRelation: "semesters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notes_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      pomodoro_sessions: {
        Row: {
          completed_at: string
          duration_minutes: number
          id: string
          points_awarded: number
          user_id: string
        }
        Insert: {
          completed_at?: string
          duration_minutes: number
          id?: string
          points_awarded: number
          user_id: string
        }
        Update: {
          completed_at?: string
          duration_minutes?: number
          id?: string
          points_awarded?: number
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          best_streak: number
          created_at: string
          current_streak: number
          email: string
          id: string
          last_active_date: string | null
          total_points: number
          updated_at: string
          username: string
        }
        Insert: {
          avatar_url?: string | null
          best_streak?: number
          created_at?: string
          current_streak?: number
          email: string
          id: string
          last_active_date?: string | null
          total_points?: number
          updated_at?: string
          username: string
        }
        Update: {
          avatar_url?: string | null
          best_streak?: number
          created_at?: string
          current_streak?: number
          email?: string
          id?: string
          last_active_date?: string | null
          total_points?: number
          updated_at?: string
          username?: string
        }
        Relationships: []
      }
      semesters: {
        Row: {
          archived: boolean
          created_at: string
          id: string
          name: string
          position: number
        }
        Insert: {
          archived?: boolean
          created_at?: string
          id?: string
          name: string
          position?: number
        }
        Update: {
          archived?: boolean
          created_at?: string
          id?: string
          name?: string
          position?: number
        }
        Relationships: []
      }
      streak_history: {
        Row: {
          active_date: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          active_date: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          active_date?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      subjects: {
        Row: {
          created_at: string
          id: string
          name: string
          semester_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          semester_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          semester_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subjects_semester_id_fkey"
            columns: ["semester_id"]
            isOneToOne: false
            referencedRelation: "semesters"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          completed_at: string | null
          created_at: string
          description: string | null
          difficulty: Database["public"]["Enums"]["task_difficulty"]
          due_date: string
          id: string
          points_awarded: number
          status: Database["public"]["Enums"]["task_status"]
          subject: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          description?: string | null
          difficulty?: Database["public"]["Enums"]["task_difficulty"]
          due_date: string
          id?: string
          points_awarded?: number
          status?: Database["public"]["Enums"]["task_status"]
          subject?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          description?: string | null
          difficulty?: Database["public"]["Enums"]["task_difficulty"]
          due_date?: string
          id?: string
          points_awarded?: number
          status?: Database["public"]["Enums"]["task_status"]
          subject?: string | null
          title?: string
          updated_at?: string
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
      [_ in never]: never
    }
    Functions: {
      award_points_and_streak: {
        Args: { _points: number; _user_id: string }
        Returns: {
          avatar_url: string | null
          best_streak: number
          created_at: string
          current_streak: number
          email: string
          id: string
          last_active_date: string | null
          total_points: number
          updated_at: string
          username: string
        }
        SetofOptions: {
          from: "*"
          to: "profiles"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
      note_tag: "notes" | "pyq" | "important" | "lab_manual" | "formula_sheet"
      task_difficulty: "easy" | "medium" | "hard"
      task_status: "pending" | "completed"
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
      app_role: ["admin", "user"],
      note_tag: ["notes", "pyq", "important", "lab_manual", "formula_sheet"],
      task_difficulty: ["easy", "medium", "hard"],
      task_status: ["pending", "completed"],
    },
  },
} as const
