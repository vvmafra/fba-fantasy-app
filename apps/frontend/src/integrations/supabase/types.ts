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
      free_agents: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          youtube_url: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          youtube_url: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          youtube_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "free_agents_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string | null
          id: string
          message: string | null
          read: boolean | null
          ref_id: string | null
          ref_table: string | null
          type: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          message?: string | null
          read?: boolean | null
          ref_id?: string | null
          ref_table?: string | null
          type?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          message?: string | null
          read?: boolean | null
          ref_id?: string | null
          ref_table?: string | null
          type?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      picks: {
        Row: {
          current_team_id: string | null
          id: string
          original_team_id: string | null
          round: number | null
          season: string | null
        }
        Insert: {
          current_team_id?: string | null
          id?: string
          original_team_id?: string | null
          round?: number | null
          season?: string | null
        }
        Update: {
          current_team_id?: string | null
          id?: string
          original_team_id?: string | null
          round?: number | null
          season?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "picks_current_team_id_fkey"
            columns: ["current_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "picks_original_team_id_fkey"
            columns: ["original_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      player_history: {
        Row: {
          created_at: string | null
          from_team_id: string | null
          id: string
          player_id: string | null
          reason: string | null
          to_team_id: string | null
        }
        Insert: {
          created_at?: string | null
          from_team_id?: string | null
          id?: string
          player_id?: string | null
          reason?: string | null
          to_team_id?: string | null
        }
        Update: {
          created_at?: string | null
          from_team_id?: string | null
          id?: string
          player_id?: string | null
          reason?: string | null
          to_team_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "player_history_from_team_id_fkey"
            columns: ["from_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_history_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_history_to_team_id_fkey"
            columns: ["to_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      players: {
        Row: {
          age: number | null
          created_at: string | null
          id: number
          name: string
          ovr: number | null
          position: string | null
          source: 'ocr' | 'manual' | null
          
          // Campos de estatísticas específicos
          ins: string | null
          mid: string | null
          "3pt": string | null
          ins_d: string | null
          per_d: string | null
          plmk: string | null
          reb: string | null
          phys: string | null
          iq: string | null
          pot: string | null
          
          team_id: number | null
        }
        Insert: {
          age?: number | null
          created_at?: string | null
          id?: number
          name: string
          ovr?: number | null
          position?: string | null
          source?: 'ocr' | 'manual' | null
          
          // Campos de estatísticas específicos
          ins?: string | null
          mid?: string | null
          "3pt"?: string | null
          ins_d?: string | null
          per_d?: string | null
          plmk?: string | null
          reb?: string | null
          phys?: string | null
          iq?: string | null
          pot?: string | null
          
          team_id?: number | null
        }
        Update: {
          age?: number | null
          created_at?: string | null
          id?: number
          name?: string
          ovr?: number | null
          position?: string | null
          source?: 'ocr' | 'manual' | null
          
          // Campos de estatísticas específicos
          ins?: string | null
          mid?: string | null
          "3pt"?: string | null
          ins_d?: string | null
          per_d?: string | null
          plmk?: string | null
          reb?: string | null
          phys?: string | null
          iq?: string | null
          pot?: string | null
          
          team_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "players_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      season_stats: {
        Row: {
          created_at: string | null
          data: Json | null
          id: string
          image_url: string | null
          season: string | null
          type: string | null
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string | null
          data?: Json | null
          id?: string
          image_url?: string | null
          season?: string | null
          type?: string | null
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string | null
          data?: Json | null
          id?: string
          image_url?: string | null
          season?: string | null
          type?: string | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "season_stats_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          abbreviation: string
          id: string
          name: string
          owner_id: string | null
        }
        Insert: {
          abbreviation: string
          id?: string
          name: string
          owner_id?: string | null
        }
        Update: {
          abbreviation?: string
          id?: string
          name?: string
          owner_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "teams_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      trade_approvals: {
        Row: {
          approved: boolean | null
          created_at: string | null
          id: string
          trade_id: string | null
          user_id: string | null
        }
        Insert: {
          approved?: boolean | null
          created_at?: string | null
          id?: string
          trade_id?: string | null
          user_id?: string | null
        }
        Update: {
          approved?: boolean | null
          created_at?: string | null
          id?: string
          trade_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "trade_approvals_trade_id_fkey"
            columns: ["trade_id"]
            isOneToOne: false
            referencedRelation: "trades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trade_approvals_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      trade_comments: {
        Row: {
          comment: string | null
          created_at: string | null
          id: string
          trade_id: string | null
          user_id: string | null
        }
        Insert: {
          comment?: string | null
          created_at?: string | null
          id?: string
          trade_id?: string | null
          user_id?: string | null
        }
        Update: {
          comment?: string | null
          created_at?: string | null
          id?: string
          trade_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "trade_comments_trade_id_fkey"
            columns: ["trade_id"]
            isOneToOne: false
            referencedRelation: "trades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trade_comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      trade_items: {
        Row: {
          from_team_id: string | null
          id: string
          ref_id: string
          to_team_id: string | null
          trade_id: string | null
          type: string | null
        }
        Insert: {
          from_team_id?: string | null
          id?: string
          ref_id: string
          to_team_id?: string | null
          trade_id?: string | null
          type?: string | null
        }
        Update: {
          from_team_id?: string | null
          id?: string
          ref_id?: string
          to_team_id?: string | null
          trade_id?: string | null
          type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "trade_items_from_team_id_fkey"
            columns: ["from_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trade_items_to_team_id_fkey"
            columns: ["to_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trade_items_trade_id_fkey"
            columns: ["trade_id"]
            isOneToOne: false
            referencedRelation: "trades"
            referencedColumns: ["id"]
          },
        ]
      }
      trades: {
        Row: {
          confirmed_by: string | null
          created_at: string | null
          created_by: string | null
          id: string
          status: string | null
        }
        Insert: {
          confirmed_by?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          status?: string | null
        }
        Update: {
          confirmed_by?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "trades_confirmed_by_fkey"
            columns: ["confirmed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trades_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          id: string
          name: string
          role: string | null
        }
        Insert: {
          id: string
          name: string
          role?: string | null
        }
        Update: {
          id?: string
          name?: string
          role?: string | null
        }
        Relationships: []
      }
      waivers_log: {
        Row: {
          action: string | null
          created_at: string | null
          id: string
          player_id: string | null
          team_id: string | null
        }
        Insert: {
          action?: string | null
          created_at?: string | null
          id?: string
          player_id?: string | null
          team_id?: string | null
        }
        Update: {
          action?: string | null
          created_at?: string | null
          id?: string
          player_id?: string | null
          team_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "waivers_log_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "waivers_log_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
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
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
