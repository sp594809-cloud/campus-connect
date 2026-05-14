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
        Relationships: [
          {
            foreignKeyName: "communities_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "employability_score_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "communities_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
            referencedRelation: "employability_score_view"
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
        Relationships: [
          {
            foreignKeyName: "community_messages_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "employability_score_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          aliases: string[]
          category: Database["public"]["Enums"]["company_category"]
          created_at: string
          emoji: string
          id: string
          name: string
        }
        Insert: {
          aliases?: string[]
          category: Database["public"]["Enums"]["company_category"]
          created_at?: string
          emoji?: string
          id?: string
          name: string
        }
        Update: {
          aliases?: string[]
          category?: Database["public"]["Enums"]["company_category"]
          created_at?: string
          emoji?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      connection_requests: {
        Row: {
          created_at: string
          id: string
          message: string
          recipient_id: string
          requester_id: string
          status: Database["public"]["Enums"]["connection_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          message?: string
          recipient_id: string
          requester_id: string
          status?: Database["public"]["Enums"]["connection_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          recipient_id?: string
          requester_id?: string
          status?: Database["public"]["Enums"]["connection_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "connection_requests_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "employability_score_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "connection_requests_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "connection_requests_requester_id_fkey"
            columns: ["requester_id"]
            isOneToOne: false
            referencedRelation: "employability_score_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "connection_requests_requester_id_fkey"
            columns: ["requester_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
            referencedRelation: "employability_score_view"
            referencedColumns: ["id"]
          },
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
            referencedRelation: "employability_score_view"
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
      dsa_completions: {
        Row: {
          completed_on: string
          created_at: string
          id: string
          note: string | null
          user_id: string
        }
        Insert: {
          completed_on?: string
          created_at?: string
          id?: string
          note?: string | null
          user_id: string
        }
        Update: {
          completed_on?: string
          created_at?: string
          id?: string
          note?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "dsa_completions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "employability_score_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dsa_completions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      dsa_streaks: {
        Row: {
          current_streak: number
          last_completed_date: string | null
          longest_streak: number
          total_completed: number
          updated_at: string
          user_id: string
        }
        Insert: {
          current_streak?: number
          last_completed_date?: string | null
          longest_streak?: number
          total_completed?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          current_streak?: number
          last_completed_date?: string | null
          longest_streak?: number
          total_completed?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "dsa_streaks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "employability_score_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dsa_streaks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
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
            referencedRelation: "employability_score_view"
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
            referencedRelation: "employability_score_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      interview_experiences: {
        Row: {
          anonymous: boolean
          application_source: Database["public"]["Enums"]["application_source"]
          author_id: string
          college_year_at_time: string | null
          company_category: Database["public"]["Enums"]["company_category"]
          company_name: string
          created_at: string
          ctc_lpa: number | null
          id: string
          interview_month: number | null
          interview_year: number
          interviewer_behavior:
            | Database["public"]["Enums"]["interviewer_behavior"]
            | null
          mistakes: string | null
          outcome: Database["public"]["Enums"]["interview_outcome"]
          overall_difficulty: Database["public"]["Enums"]["difficulty_level"]
          prep_duration_months: number | null
          rejection_round: string | null
          role: string
          role_type: Database["public"]["Enums"]["role_type"]
          strategy: string | null
          updated_at: string
          upvotes_count: number
          verified: boolean
        }
        Insert: {
          anonymous?: boolean
          application_source?: Database["public"]["Enums"]["application_source"]
          author_id: string
          college_year_at_time?: string | null
          company_category?: Database["public"]["Enums"]["company_category"]
          company_name: string
          created_at?: string
          ctc_lpa?: number | null
          id?: string
          interview_month?: number | null
          interview_year: number
          interviewer_behavior?:
            | Database["public"]["Enums"]["interviewer_behavior"]
            | null
          mistakes?: string | null
          outcome: Database["public"]["Enums"]["interview_outcome"]
          overall_difficulty?: Database["public"]["Enums"]["difficulty_level"]
          prep_duration_months?: number | null
          rejection_round?: string | null
          role: string
          role_type?: Database["public"]["Enums"]["role_type"]
          strategy?: string | null
          updated_at?: string
          upvotes_count?: number
          verified?: boolean
        }
        Update: {
          anonymous?: boolean
          application_source?: Database["public"]["Enums"]["application_source"]
          author_id?: string
          college_year_at_time?: string | null
          company_category?: Database["public"]["Enums"]["company_category"]
          company_name?: string
          created_at?: string
          ctc_lpa?: number | null
          id?: string
          interview_month?: number | null
          interview_year?: number
          interviewer_behavior?:
            | Database["public"]["Enums"]["interviewer_behavior"]
            | null
          mistakes?: string | null
          outcome?: Database["public"]["Enums"]["interview_outcome"]
          overall_difficulty?: Database["public"]["Enums"]["difficulty_level"]
          prep_duration_months?: number | null
          rejection_round?: string | null
          role?: string
          role_type?: Database["public"]["Enums"]["role_type"]
          strategy?: string | null
          updated_at?: string
          upvotes_count?: number
          verified?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "interview_experiences_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "employability_score_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interview_experiences_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      interview_rounds: {
        Row: {
          code_language: string | null
          code_snippet: string | null
          created_at: string
          description: string | null
          difficulty: Database["public"]["Enums"]["difficulty_level"]
          duration_minutes: number | null
          experience_id: string
          id: string
          interviewer_behavior:
            | Database["public"]["Enums"]["interviewer_behavior"]
            | null
          mistakes_made: string | null
          question_types: string[]
          round_number: number
          round_type: Database["public"]["Enums"]["round_type"]
          strategy_used: string | null
        }
        Insert: {
          code_language?: string | null
          code_snippet?: string | null
          created_at?: string
          description?: string | null
          difficulty?: Database["public"]["Enums"]["difficulty_level"]
          duration_minutes?: number | null
          experience_id: string
          id?: string
          interviewer_behavior?:
            | Database["public"]["Enums"]["interviewer_behavior"]
            | null
          mistakes_made?: string | null
          question_types?: string[]
          round_number: number
          round_type: Database["public"]["Enums"]["round_type"]
          strategy_used?: string | null
        }
        Update: {
          code_language?: string | null
          code_snippet?: string | null
          created_at?: string
          description?: string | null
          difficulty?: Database["public"]["Enums"]["difficulty_level"]
          duration_minutes?: number | null
          experience_id?: string
          id?: string
          interviewer_behavior?:
            | Database["public"]["Enums"]["interviewer_behavior"]
            | null
          mistakes_made?: string | null
          question_types?: string[]
          round_number?: number
          round_type?: Database["public"]["Enums"]["round_type"]
          strategy_used?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "interview_rounds_experience_id_fkey"
            columns: ["experience_id"]
            isOneToOne: false
            referencedRelation: "interview_experiences"
            referencedColumns: ["id"]
          },
        ]
      }
      karma_events: {
        Row: {
          action: Database["public"]["Enums"]["karma_action"]
          created_at: string
          id: string
          note: string | null
          points: number
          ref_id: string | null
          user_id: string
        }
        Insert: {
          action: Database["public"]["Enums"]["karma_action"]
          created_at?: string
          id?: string
          note?: string | null
          points: number
          ref_id?: string | null
          user_id: string
        }
        Update: {
          action?: Database["public"]["Enums"]["karma_action"]
          created_at?: string
          id?: string
          note?: string | null
          points?: number
          ref_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "karma_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "employability_score_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "karma_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_listings: {
        Row: {
          category: string
          created_at: string
          description: string
          id: string
          image_url: string | null
          price: number
          seller_id: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          category?: string
          created_at?: string
          description?: string
          id?: string
          image_url?: string | null
          price?: number
          seller_id: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string
          id?: string
          image_url?: string | null
          price?: number
          seller_id?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_listings_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "employability_score_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_listings_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      material_purchases: {
        Row: {
          buyer_id: string
          created_at: string
          id: string
          listing_id: string
          material_id: string
        }
        Insert: {
          buyer_id: string
          created_at?: string
          id?: string
          listing_id: string
          material_id: string
        }
        Update: {
          buyer_id?: string
          created_at?: string
          id?: string
          listing_id?: string
          material_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "material_purchases_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "employability_score_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "material_purchases_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "material_purchases_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "marketplace_listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "material_purchases_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "study_materials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "material_purchases_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "top_selling_materials"
            referencedColumns: ["material_id"]
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
            referencedRelation: "employability_score_view"
            referencedColumns: ["id"]
          },
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
            referencedRelation: "employability_score_view"
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
            referencedRelation: "employability_score_view"
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
      otp_codes: {
        Row: {
          attempts: number
          code_hash: string
          consumed: boolean
          created_at: string
          expires_at: string
          id: string
          phone_number: string
        }
        Insert: {
          attempts?: number
          code_hash: string
          consumed?: boolean
          created_at?: string
          expires_at: string
          id?: string
          phone_number: string
        }
        Update: {
          attempts?: number
          code_hash?: string
          consumed?: boolean
          created_at?: string
          expires_at?: string
          id?: string
          phone_number?: string
        }
        Relationships: []
      }
      post_comments: {
        Row: {
          author_id: string
          content: string
          created_at: string
          id: string
          post_id: string
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string
          id?: string
          post_id: string
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string
          id?: string
          post_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_comments_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "employability_score_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_comments_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
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
            referencedRelation: "employability_score_view"
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
            referencedRelation: "employability_score_view"
            referencedColumns: ["id"]
          },
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
          college_name: string | null
          company: string | null
          created_at: string
          github: string | null
          graduation_year: number | null
          id: string
          interests: string[]
          karma_total: number
          linkedin: string | null
          looking_for_mentor_in: string[]
          mentor_bio: string | null
          mentor_mode: boolean
          mentor_topics: string[]
          name: string
          onboarded: boolean
          open_to_mentor: boolean
          placement_status: Database["public"]["Enums"]["placement_status"]
          resume_url: string | null
          skills: string[]
          updated_at: string
          username: string | null
          verified: boolean
          weekly_capacity: number
          year: Database["public"]["Enums"]["year_type"] | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          branch?: Database["public"]["Enums"]["branch_type"] | null
          college_email_verified?: boolean
          college_name?: string | null
          company?: string | null
          created_at?: string
          github?: string | null
          graduation_year?: number | null
          id: string
          interests?: string[]
          karma_total?: number
          linkedin?: string | null
          looking_for_mentor_in?: string[]
          mentor_bio?: string | null
          mentor_mode?: boolean
          mentor_topics?: string[]
          name?: string
          onboarded?: boolean
          open_to_mentor?: boolean
          placement_status?: Database["public"]["Enums"]["placement_status"]
          resume_url?: string | null
          skills?: string[]
          updated_at?: string
          username?: string | null
          verified?: boolean
          weekly_capacity?: number
          year?: Database["public"]["Enums"]["year_type"] | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          branch?: Database["public"]["Enums"]["branch_type"] | null
          college_email_verified?: boolean
          college_name?: string | null
          company?: string | null
          created_at?: string
          github?: string | null
          graduation_year?: number | null
          id?: string
          interests?: string[]
          karma_total?: number
          linkedin?: string | null
          looking_for_mentor_in?: string[]
          mentor_bio?: string | null
          mentor_mode?: boolean
          mentor_topics?: string[]
          name?: string
          onboarded?: boolean
          open_to_mentor?: boolean
          placement_status?: Database["public"]["Enums"]["placement_status"]
          resume_url?: string | null
          skills?: string[]
          updated_at?: string
          username?: string | null
          verified?: boolean
          weekly_capacity?: number
          year?: Database["public"]["Enums"]["year_type"] | null
        }
        Relationships: []
      }
      recruiter_notes: {
        Row: {
          created_at: string
          id: string
          note: string
          recruiter_id: string
          student_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          note?: string
          recruiter_id: string
          student_id: string
        }
        Update: {
          created_at?: string
          id?: string
          note?: string
          recruiter_id?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recruiter_notes_recruiter_id_fkey"
            columns: ["recruiter_id"]
            isOneToOne: false
            referencedRelation: "employability_score_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recruiter_notes_recruiter_id_fkey"
            columns: ["recruiter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recruiter_notes_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "employability_score_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recruiter_notes_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      recruiter_saved_candidates: {
        Row: {
          created_at: string
          id: string
          recruiter_id: string
          shortlisted: boolean
          student_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          recruiter_id: string
          shortlisted?: boolean
          student_id: string
        }
        Update: {
          created_at?: string
          id?: string
          recruiter_id?: string
          shortlisted?: boolean
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recruiter_saved_candidates_recruiter_id_fkey"
            columns: ["recruiter_id"]
            isOneToOne: false
            referencedRelation: "employability_score_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recruiter_saved_candidates_recruiter_id_fkey"
            columns: ["recruiter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recruiter_saved_candidates_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "employability_score_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recruiter_saved_candidates_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      registered_phones: {
        Row: {
          enrollment_id: string
          full_name: string
          phone_number: string
          registered_at: string
        }
        Insert: {
          enrollment_id: string
          full_name: string
          phone_number: string
          registered_at?: string
        }
        Update: {
          enrollment_id?: string
          full_name?: string
          phone_number?: string
          registered_at?: string
        }
        Relationships: []
      }
      student1: {
        Row: {
          branch: string | null
          created_at: string
          current_year: number | null
          enrollment_id: string
          full_name: string
          id: string
          phone_number: string
        }
        Insert: {
          branch?: string | null
          created_at?: string
          current_year?: number | null
          enrollment_id: string
          full_name: string
          id?: string
          phone_number: string
        }
        Update: {
          branch?: string | null
          created_at?: string
          current_year?: number | null
          enrollment_id?: string
          full_name?: string
          id?: string
          phone_number?: string
        }
        Relationships: []
      }
      study_material_secrets: {
        Row: {
          content_text: string | null
          created_at: string
          embedding: string | null
          material_id: string
          meeting_link: string | null
          pdf_path: string | null
        }
        Insert: {
          content_text?: string | null
          created_at?: string
          embedding?: string | null
          material_id: string
          meeting_link?: string | null
          pdf_path?: string | null
        }
        Update: {
          content_text?: string | null
          created_at?: string
          embedding?: string | null
          material_id?: string
          meeting_link?: string | null
          pdf_path?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "study_material_secrets_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: true
            referencedRelation: "study_materials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "study_material_secrets_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: true
            referencedRelation: "top_selling_materials"
            referencedColumns: ["material_id"]
          },
        ]
      }
      study_materials: {
        Row: {
          created_at: string
          has_meeting: boolean
          has_pdf: boolean
          id: string
          listing_id: string
          preview_text: string
          seller_id: string
          type: Database["public"]["Enums"]["study_material_type"]
        }
        Insert: {
          created_at?: string
          has_meeting?: boolean
          has_pdf?: boolean
          id?: string
          listing_id: string
          preview_text?: string
          seller_id: string
          type: Database["public"]["Enums"]["study_material_type"]
        }
        Update: {
          created_at?: string
          has_meeting?: boolean
          has_pdf?: boolean
          id?: string
          listing_id?: string
          preview_text?: string
          seller_id?: string
          type?: Database["public"]["Enums"]["study_material_type"]
        }
        Relationships: [
          {
            foreignKeyName: "study_materials_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "marketplace_listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "study_materials_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "employability_score_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "study_materials_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "employability_score_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      employability_score_view: {
        Row: {
          avatar_url: string | null
          branch: Database["public"]["Enums"]["branch_type"] | null
          college_name: string | null
          company: string | null
          current_streak: number | null
          employability_score: number | null
          graduation_year: number | null
          id: string | null
          interview_posts_count: number | null
          karma_total: number | null
          longest_streak: number | null
          name: string | null
          placement_status:
            | Database["public"]["Enums"]["placement_status"]
            | null
          posts_count: number | null
          skills: string[] | null
          total_completed: number | null
          username: string | null
          verified: boolean | null
          year: Database["public"]["Enums"]["year_type"] | null
        }
        Relationships: []
      }
      top_selling_materials: {
        Row: {
          last_sale_at: string | null
          listing_id: string | null
          material_id: string | null
          sales_count: number | null
          seller_id: string | null
          type: Database["public"]["Enums"]["study_material_type"] | null
        }
        Relationships: [
          {
            foreignKeyName: "study_materials_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "marketplace_listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "study_materials_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "employability_score_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "study_materials_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      are_connected: { Args: { a: string; b: string }; Returns: boolean }
      cleanup_expired_otp_codes: { Args: never; Returns: number }
      get_or_create_conversation: {
        Args: { other_user: string }
        Returns: string
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      has_unlocked_material: {
        Args: { _mid: string; _uid: string }
        Returns: boolean
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
      is_phone_registered: { Args: { _phone: string }; Returns: boolean }
      lookup_student_by_enrollment: {
        Args: { _q: string }
        Returns: {
          enrollment_id: string
          full_name: string
        }[]
      }
      lookup_student_by_phone: {
        Args: { _phone: string }
        Returns: {
          enrollment_id: string
          full_name: string
          phone_number: string
        }[]
      }
      purchase_material: { Args: { _material_id: string }; Returns: string }
      refresh_top_selling_materials: { Args: never; Returns: undefined }
      search_my_library: {
        Args: { match_count?: number; query_embedding: string }
        Returns: {
          listing_id: string
          material_id: string
          similarity: number
        }[]
      }
    }
    Enums: {
      app_role: "student" | "recruiter" | "admin"
      application_source:
        | "tpo"
        | "referral"
        | "off_campus"
        | "linkedin"
        | "pool_campus"
      branch_type: "CSE" | "ECE" | "ME" | "EE" | "CE" | "IT" | "Other"
      company_category:
        | "product"
        | "service"
        | "fintech"
        | "gcc"
        | "startup"
        | "core"
      connection_status: "pending" | "accepted" | "declined"
      difficulty_level: "easy" | "medium" | "hard"
      interview_outcome: "selected" | "rejected" | "waitlisted" | "withdrew"
      interviewer_behavior: "friendly" | "neutral" | "stress_test" | "rude"
      karma_action:
        | "interview_post"
        | "mentorship_completed"
        | "advice_upvoted"
        | "daily_streak"
        | "resume_review"
        | "mock_interview"
        | "aspire_engage"
      mentorship_status: "pending" | "accepted" | "declined"
      placement_status: "Placed" | "Looking" | "Interning" | "N/A"
      post_type: "update" | "question" | "achievement" | "resource"
      role_type: "internship" | "full_time" | "ppo"
      round_type:
        | "oa"
        | "technical"
        | "system_design"
        | "managerial"
        | "hr"
        | "group_discussion"
      study_material_type: "PDF_Notes" | "Live_Masterclass"
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
      app_role: ["student", "recruiter", "admin"],
      application_source: [
        "tpo",
        "referral",
        "off_campus",
        "linkedin",
        "pool_campus",
      ],
      branch_type: ["CSE", "ECE", "ME", "EE", "CE", "IT", "Other"],
      company_category: [
        "product",
        "service",
        "fintech",
        "gcc",
        "startup",
        "core",
      ],
      connection_status: ["pending", "accepted", "declined"],
      difficulty_level: ["easy", "medium", "hard"],
      interview_outcome: ["selected", "rejected", "waitlisted", "withdrew"],
      interviewer_behavior: ["friendly", "neutral", "stress_test", "rude"],
      karma_action: [
        "interview_post",
        "mentorship_completed",
        "advice_upvoted",
        "daily_streak",
        "resume_review",
        "mock_interview",
        "aspire_engage",
      ],
      mentorship_status: ["pending", "accepted", "declined"],
      placement_status: ["Placed", "Looking", "Interning", "N/A"],
      post_type: ["update", "question", "achievement", "resource"],
      role_type: ["internship", "full_time", "ppo"],
      round_type: [
        "oa",
        "technical",
        "system_design",
        "managerial",
        "hr",
        "group_discussion",
      ],
      study_material_type: ["PDF_Notes", "Live_Masterclass"],
      year_type: ["1st", "2nd", "3rd", "4th"],
    },
  },
} as const
