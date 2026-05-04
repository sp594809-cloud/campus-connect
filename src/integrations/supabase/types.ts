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
      college_roster: {
        Row: {
          branch: string | null
          created_at: string | null
          current_year: number | null
          enrollment_id: string
          full_name: string
          id: string
          mobile_number: string
        }
        Insert: {
          branch?: string | null
          created_at?: string | null
          current_year?: number | null
          enrollment_id: string
          full_name: string
          id?: string
          mobile_number: string
        }
        Update: {
          branch?: string | null
          created_at?: string | null
          current_year?: number | null
          enrollment_id?: string
          full_name?: string
          id?: string
          mobile_number?: string
        }
        Relationships: []
      }
      communities: {
        Row: {
          admins_only: boolean
          color: string
          created_at: string
          created_by: string | null
          description: string
          emoji: string
          id: string
          interest: string
          name: string
        }
        Insert: {
          admins_only?: boolean
          color?: string
          created_at?: string
          created_by?: string | null
          description?: string
          emoji?: string
          id?: string
          interest: string
          name: string
        }
        Update: {
          admins_only?: boolean
          color?: string
          created_at?: string
          created_by?: string | null
          description?: string
          emoji?: string
          id?: string
          interest?: string
          name?: string
        }
        Relationships: []
      }
      community_members: {
        Row: {
          community_id: string
          joined_at: string
          user_id: string
        }
        Insert: {
          community_id: string
          joined_at?: string
          user_id: string
        }
        Update: {
          community_id?: string
          joined_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_members_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      community_messages: {
        Row: {
          attachment_type: string | null
          attachment_url: string | null
          community_id: string
          content: string | null
          created_at: string
          id: string
          sender_id: string
        }
        Insert: {
          attachment_type?: string | null
          attachment_url?: string | null
          community_id: string
          content?: string | null
          created_at?: string
          id?: string
          sender_id: string
        }
        Update: {
          attachment_type?: string | null
          attachment_url?: string | null
          community_id?: string
          content?: string | null
          created_at?: string
          id?: string
          sender_id?: string
        }
        Relationships: []
      }
      conversations: {
        Row: {
          created_at: string
          id: string
          last_message_at: string
          user_a: string
          user_b: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_message_at?: string
          user_a: string
          user_b: string
        }
        Update: {
          created_at?: string
          id?: string
          last_message_at?: string
          user_a?: string
          user_b?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_user_a_fkey"
            columns: ["user_a"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_user_b_fkey"
            columns: ["user_b"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      event_rsvps: {
        Row: {
          created_at: string
          event_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          event_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_rsvps_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_rsvps_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          created_at: string
          created_by: string | null
          description: string
          emoji: string
          id: string
          location: string
          organizer: string
          starts_at: string
          title: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string
          emoji?: string
          id?: string
          location?: string
          organizer?: string
          starts_at: string
          title: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string
          emoji?: string
          id?: string
          location?: string
          organizer?: string
          starts_at?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      mentorship_requests: {
        Row: {
          created_at: string
          id: string
          mentor_id: string
          message: string
          requester_id: string
          status: Database["public"]["Enums"]["mentorship_status"]
          topic: string
        }
        Insert: {
          created_at?: string
          id?: string
          mentor_id: string
          message?: string
          requester_id: string
          status?: Database["public"]["Enums"]["mentorship_status"]
          topic: string
        }
        Update: {
          created_at?: string
          id?: string
          mentor_id?: string
          message?: string
          requester_id?: string
          status?: Database["public"]["Enums"]["mentorship_status"]
          topic?: string
        }
        Relationships: [
          {
            foreignKeyName: "mentorship_requests_mentor_id_fkey"
            columns: ["mentor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mentorship_requests_requester_id_fkey"
            columns: ["requester_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          attachment_type: string | null
          attachment_url: string | null
          content: string | null
          conversation_id: string
          created_at: string
          id: string
          read: boolean
          sender_id: string
        }
        Insert: {
          attachment_type?: string | null
          attachment_url?: string | null
          content?: string | null
          conversation_id: string
          created_at?: string
          id?: string
          read?: boolean
          sender_id: string
        }
        Update: {
          attachment_type?: string | null
          attachment_url?: string | null
          content?: string | null
          conversation_id?: string
          created_at?: string
          id?: string
          read?: boolean
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      post_likes: {
        Row: {
          created_at: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          attachment_type: string | null
          attachment_url: string | null
          author_id: string
          content: string
          created_at: string
          id: string
          pinned: boolean
          tag: string | null
          type: Database["public"]["Enums"]["post_type"]
        }
        Insert: {
          attachment_type?: string | null
          attachment_url?: string | null
          author_id: string
          content: string
          created_at?: string
          id?: string
          pinned?: boolean
          tag?: string | null
          type?: Database["public"]["Enums"]["post_type"]
        }
        Update: {
          attachment_type?: string | null
          attachment_url?: string | null
          author_id?: string
          content?: string
          created_at?: string
          id?: string
          pinned?: boolean
          tag?: string | null
          type?: Database["public"]["Enums"]["post_type"]
        }
        Relationships: [
          {
            foreignKeyName: "posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          branch: Database["public"]["Enums"]["branch_type"] | null
          college_email_verified: boolean
          company: string | null
          created_at: string
          github: string | null
          id: string
          interests: string[]
          linkedin: string | null
          looking_for_mentor_in: string[]
          name: string
          onboarded: boolean
          open_to_mentor: boolean
          placement_status: Database["public"]["Enums"]["placement_status"]
          skills: string[]
          updated_at: string
          year: Database["public"]["Enums"]["year_type"] | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          branch?: Database["public"]["Enums"]["branch_type"] | null
          college_email_verified?: boolean
          company?: string | null
          created_at?: string
          github?: string | null
          id: string
          interests?: string[]
          linkedin?: string | null
          looking_for_mentor_in?: string[]
          name?: string
          onboarded?: boolean
          open_to_mentor?: boolean
          placement_status?: Database["public"]["Enums"]["placement_status"]
          skills?: string[]
          updated_at?: string
          year?: Database["public"]["Enums"]["year_type"] | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          branch?: Database["public"]["Enums"]["branch_type"] | null
          college_email_verified?: boolean
          company?: string | null
          created_at?: string
          github?: string | null
          id?: string
          interests?: string[]
          linkedin?: string | null
          looking_for_mentor_in?: string[]
          name?: string
          onboarded?: boolean
          open_to_mentor?: boolean
          placement_status?: Database["public"]["Enums"]["placement_status"]
          skills?: string[]
          updated_at?: string
          year?: Database["public"]["Enums"]["year_type"] | null
        }
        Relationships: []
      }
      verified_students: {
        Row: {
          created_at: string | null
          enrollment_id: string | null
          id: string
          mobile_number: string | null
        }
        Insert: {
          created_at?: string | null
          enrollment_id?: string | null
          id?: string
          mobile_number?: string | null
        }
        Update: {
          created_at?: string | null
          enrollment_id?: string | null
          id?: string
          mobile_number?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_or_create_conversation: {
        Args: { other_user: string }
        Returns: string
      }
      is_community_admin: {
        Args: { _cid: string; _uid: string }
        Returns: boolean
      }
      is_community_member: {
        Args: { _cid: string; _uid: string }
        Returns: boolean
      }
      is_conversation_participant: {
        Args: { conv_id: string; uid: string }
        Returns: boolean
      }
    }
    Enums: {
      branch_type: "CSE" | "ECE" | "ME" | "EE" | "CE" | "IT" | "Other"
      mentorship_status: "pending" | "accepted" | "declined"
      placement_status: "Placed" | "Looking" | "Interning" | "N/A"
      post_type: "update" | "question" | "achievement" | "resource"
      year_type: "1st" | "2nd" | "3rd" | "4th"
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
      branch_type: ["CSE", "ECE", "ME", "EE", "CE", "IT", "Other"],
      mentorship_status: ["pending", "accepted", "declined"],
      placement_status: ["Placed", "Looking", "Interning", "N/A"],
      post_type: ["update", "question", "achievement", "resource"],
      year_type: ["1st", "2nd", "3rd", "4th"],
    },
  },
} as const
