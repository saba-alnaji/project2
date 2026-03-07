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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      books: {
        Row: {
          author: string | null
          barcode: string | null
          classification_code: string | null
          created_at: string
          height: string | null
          id: string
          is_available: boolean
          serial_number: string | null
          title: string
          updated_at: string
        }
        Insert: {
          author?: string | null
          barcode?: string | null
          classification_code?: string | null
          created_at?: string
          height?: string | null
          id?: string
          is_available?: boolean
          serial_number?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          author?: string | null
          barcode?: string | null
          classification_code?: string | null
          created_at?: string
          height?: string | null
          id?: string
          is_available?: boolean
          serial_number?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      fines: {
        Row: {
          amount: number
          book_title: string | null
          created_at: string
          fine_type: string
          id: string
          loan_id: string | null
          notes: string | null
          subscriber_id: string
        }
        Insert: {
          amount?: number
          book_title?: string | null
          created_at?: string
          fine_type?: string
          id?: string
          loan_id?: string | null
          notes?: string | null
          subscriber_id: string
        }
        Update: {
          amount?: number
          book_title?: string | null
          created_at?: string
          fine_type?: string
          id?: string
          loan_id?: string | null
          notes?: string | null
          subscriber_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fines_loan_id_fkey"
            columns: ["loan_id"]
            isOneToOne: false
            referencedRelation: "loans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fines_subscriber_id_fkey"
            columns: ["subscriber_id"]
            isOneToOne: false
            referencedRelation: "subscribers"
            referencedColumns: ["id"]
          },
        ]
      }
      guarantors: {
        Row: {
          address: string | null
          created_at: string
          id: string
          job: string | null
          mobile_numbers: string[] | null
          name: string
          national_id: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          id?: string
          job?: string | null
          mobile_numbers?: string[] | null
          name: string
          national_id: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          id?: string
          job?: string | null
          mobile_numbers?: string[] | null
          name?: string
          national_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      loan_requests: {
        Row: {
          book_height: string | null
          book_title: string
          classification_code: string | null
          created_at: string
          id: string
          request_date: string
          status: string
          subscriber_id: string
        }
        Insert: {
          book_height?: string | null
          book_title: string
          classification_code?: string | null
          created_at?: string
          id?: string
          request_date?: string
          status?: string
          subscriber_id: string
        }
        Update: {
          book_height?: string | null
          book_title?: string
          classification_code?: string | null
          created_at?: string
          id?: string
          request_date?: string
          status?: string
          subscriber_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "loan_requests_subscriber_id_fkey"
            columns: ["subscriber_id"]
            isOneToOne: false
            referencedRelation: "subscribers"
            referencedColumns: ["id"]
          },
        ]
      }
      loans: {
        Row: {
          actual_return_date: string | null
          book_condition: string | null
          book_id: string
          created_at: string
          expected_return_date: string
          id: string
          loan_date: string
          notes: string | null
          status: string
          subscriber_id: string
          updated_at: string
        }
        Insert: {
          actual_return_date?: string | null
          book_condition?: string | null
          book_id: string
          created_at?: string
          expected_return_date?: string
          id?: string
          loan_date?: string
          notes?: string | null
          status?: string
          subscriber_id: string
          updated_at?: string
        }
        Update: {
          actual_return_date?: string | null
          book_condition?: string | null
          book_id?: string
          created_at?: string
          expected_return_date?: string
          id?: string
          loan_date?: string
          notes?: string | null
          status?: string
          subscriber_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "loans_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loans_subscriber_id_fkey"
            columns: ["subscriber_id"]
            isOneToOne: false
            referencedRelation: "subscribers"
            referencedColumns: ["id"]
          },
        ]
      }
      subscribers: {
        Row: {
          address: string | null
          birth_date: string | null
          created_at: string
          gender: string | null
          governorate: string | null
          guarantor_id: string | null
          id: string
          job: string | null
          mobile_numbers: string[] | null
          name: string
          national_id: string | null
          subscriber_number: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          birth_date?: string | null
          created_at?: string
          gender?: string | null
          governorate?: string | null
          guarantor_id?: string | null
          id?: string
          job?: string | null
          mobile_numbers?: string[] | null
          name: string
          national_id?: string | null
          subscriber_number?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          birth_date?: string | null
          created_at?: string
          gender?: string | null
          governorate?: string | null
          guarantor_id?: string | null
          id?: string
          job?: string | null
          mobile_numbers?: string[] | null
          name?: string
          national_id?: string | null
          subscriber_number?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscribers_guarantor_id_fkey"
            columns: ["guarantor_id"]
            isOneToOne: false
            referencedRelation: "guarantors"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_requests: {
        Row: {
          address: string | null
          created_at: string
          id: string
          phone_number: string | null
          request_date: string
          status: string
          subscriber_name: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          id?: string
          phone_number?: string | null
          request_date?: string
          status?: string
          subscriber_name: string
        }
        Update: {
          address?: string | null
          created_at?: string
          id?: string
          phone_number?: string | null
          request_date?: string
          status?: string
          subscriber_name?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          book_number: string | null
          category: string | null
          created_at: string
          duration: string | null
          end_date: string
          fee: number | null
          id: string
          notes: string | null
          payment_method: string | null
          receipt_number: string | null
          start_date: string
          status: string | null
          subscriber_id: string
          type: string | null
          updated_at: string
        }
        Insert: {
          book_number?: string | null
          category?: string | null
          created_at?: string
          duration?: string | null
          end_date: string
          fee?: number | null
          id?: string
          notes?: string | null
          payment_method?: string | null
          receipt_number?: string | null
          start_date?: string
          status?: string | null
          subscriber_id: string
          type?: string | null
          updated_at?: string
        }
        Update: {
          book_number?: string | null
          category?: string | null
          created_at?: string
          duration?: string | null
          end_date?: string
          fee?: number | null
          id?: string
          notes?: string | null
          payment_method?: string | null
          receipt_number?: string | null
          start_date?: string
          status?: string | null
          subscriber_id?: string
          type?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_subscriber_id_fkey"
            columns: ["subscriber_id"]
            isOneToOne: false
            referencedRelation: "subscribers"
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
    Enums: {},
  },
} as const
